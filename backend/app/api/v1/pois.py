import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import and_, cast, func, insert, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import verify_internal_secret
from app.core.media_processing import generate_image_thumbnail
from app.core.rate_limit import enforce_ai_rate_limit
from app.core.security import require_internal_secret_or_mobile_user
from app.core.storage import (
    UploadValidationError,
    build_public_url,
    delete_object_by_public_url,
    verify_uploaded_object,
)
from app.db.session import SessionLocal, get_db
from app.models.category import Category
from app.models.follow import Follow
from app.models.group import GroupMember, GroupMemberStatus
from app.models.notification import Notification, NotificationType
from app.models.poi import POI, POIVisibility
from app.models.poi_media import MediaType, POIMedia
from app.models.poi_reaction import PoiReaction
from app.models.user import User
from app.schemas.media import POIMediaCreate, POIMediaRead
from app.schemas.poi import POICreate, POIPublicRead, POIRead, POIUpdate, ReactionToggle
from app.services import ai_agents
from app.utils.slug import slugify_unique

logger = logging.getLogger(__name__)

router = APIRouter()


def _run_categorizer_background(poi_id: uuid.UUID) -> None:
    """Roda o POICategorizerAgent após o POI já ter sido criado e a resposta
    enviada (BackgroundTasks) — usa sua própria sessão de banco, já que a da
    requisição original é fechada antes dessa função rodar."""
    db = SessionLocal()
    try:
        poi = db.get(POI, poi_id)
        if poi is None:
            return
        try:
            enforce_ai_rate_limit(poi.user_id, "categorize", limit=50)
        except HTTPException:
            return  # limite diário atingido — não é erro, só não sugere agora

        category_slugs = list(db.scalars(select(Category.slug)).all())
        result = ai_agents.categorize_poi(poi.name, poi.description, poi.address, category_slugs)
        if result is None or result.category_slug not in category_slugs:
            return

        poi.ai_category_slug = result.category_slug
        poi.ai_icon_name = result.icon_name
        poi.ai_color_hex = result.color_hex
        poi.ai_confidence = result.confidence
        poi.ai_reasoning = result.reasoning
        db.commit()
    except Exception:
        logger.exception("Falha ao rodar o POICategorizerAgent em segundo plano")
    finally:
        db.close()


def _with_relations(stmt):
    return stmt.options(
        selectinload(POI.media),
        selectinload(POI.reactions).selectinload(PoiReaction.user),
        selectinload(POI.owner),
    )


def _serialize(poi: POI) -> dict:
    point = to_shape(poi.location)
    return {
        "id": poi.id,
        "user_id": poi.user_id,
        "category_id": poi.category_id,
        "name": poi.name,
        "slug": poi.slug,
        "description": poi.description,
        "address": poi.address,
        "lat": point.y,
        "lng": point.x,
        "visibility": poi.visibility,
        "group_id": poi.group_id,
        "icon_name": poi.icon_name,
        "ai_category_slug": poi.ai_category_slug,
        "ai_icon_name": poi.ai_icon_name,
        "ai_color_hex": poi.ai_color_hex,
        "ai_confidence": poi.ai_confidence,
        "ai_reasoning": poi.ai_reasoning,
        "created_at": poi.created_at,
        "updated_at": poi.updated_at,
        "media": poi.media,
        "reactions": [
            {"emoji": r.emoji, "user_id": r.user_id, "user_name": r.user.name}
            for r in poi.reactions
        ],
        "owner_name": poi.owner.name,
        "owner_avatar_url": poi.owner.avatar_choice_url or poi.owner.avatar_url,
    }


def _to_read(poi: POI) -> POIRead:
    return POIRead.model_validate(_serialize(poi))


def _poi_visible_to(poi: POI, user_id: uuid.UUID | None, db: Session) -> bool:
    """`True` se `poi` for público, se `user_id` for o dono, se
    `visibility=followers` e `user_id` seguir o dono do POI, ou se
    `visibility=group` e `user_id` for membro aceito de `poi.group_id`."""
    if poi.visibility == POIVisibility.public:
        return True
    if user_id is None:
        return False
    if poi.user_id == user_id:
        return True
    if poi.visibility == POIVisibility.followers:
        return db.scalar(
            select(Follow.id).where(
                Follow.follower_id == user_id, Follow.followed_id == poi.user_id
            )
        ) is not None
    if poi.visibility == POIVisibility.group:
        if poi.group_id is None:
            return False
        return db.scalar(
            select(GroupMember.id).where(
                GroupMember.group_id == poi.group_id,
                GroupMember.user_id == user_id,
                GroupMember.status == GroupMemberStatus.accepted,
            )
        ) is not None
    return False


@router.get(
    "/pois",
    response_model=list[POIRead],
)
def list_pois(
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    min_lat: float | None = Query(default=None, ge=-90, le=90),
    min_lng: float | None = Query(default=None, ge=-180, le=180),
    max_lat: float | None = Query(default=None, ge=-90, le=90),
    max_lng: float | None = Query(default=None, ge=-180, le=180),
    category_slug: str | None = None,
    q: str | None = None,
    user_id: uuid.UUID | None = None,
    mine_only: bool = False,
):
    """Lista POIs visíveis: públicos de qualquer usuário + privados do próprio
    `user_id` (quando informado). Filtra por bounding box do mapa (pan/zoom),
    categoria e busca textual por nome — todos opcionais e combináveis.
    Com `mine_only=true`, ignora os públicos de outros usuários e devolve só
    os POIs do próprio `user_id` (usado pelo painel "Meus POIs").

    Autenticação dupla (`require_internal_secret_or_mobile_user`, Fase 10
    Parte 2): atrás do segredo interno, só o BFF do Next.js pode chamar
    assim, e é ele quem resolve `user_id` a partir da sessão autenticada — o
    parâmetro nunca deve vir direto do navegador, senão qualquer um poderia
    passar o UUID de outra pessoa e ver POIs privados que não são dela. Atrás
    de um JWT do app mobile, `mobile_user_id` vem resolvido do próprio token
    e **sobrescreve** qualquer `user_id` da query — mesma proteção, só que
    pro cliente que não tem acesso ao segredo interno.
    """
    if mobile_user_id is not None:
        user_id = mobile_user_id

    stmt = _with_relations(select(POI))

    if None not in (min_lat, min_lng, max_lat, max_lng):
        envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        stmt = stmt.where(func.ST_Intersects(cast(POI.location, Geometry), envelope))

    if category_slug:
        stmt = stmt.join(Category, POI.category_id == Category.id).where(
            Category.slug == category_slug
        )

    if q:
        stmt = stmt.where(POI.name.ilike(f"%{q}%"))

    if mine_only:
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required when mine_only=true",
            )
        stmt = stmt.where(POI.user_id == user_id)
    elif user_id:
        # Meus POIs + públicos + de quem eu sigo (visibility=followers) +
        # dos grupos dos quais sou membro aceito (visibility=group).
        followed_ids = select(Follow.followed_id).where(Follow.follower_id == user_id)
        my_group_ids = select(GroupMember.group_id).where(
            GroupMember.user_id == user_id, GroupMember.status == GroupMemberStatus.accepted
        )
        stmt = stmt.where(
            or_(
                POI.user_id == user_id,
                POI.visibility == POIVisibility.public,
                and_(POI.visibility == POIVisibility.followers, POI.user_id.in_(followed_ids)),
                and_(POI.visibility == POIVisibility.group, POI.group_id.in_(my_group_ids)),
            )
        )
    else:
        stmt = stmt.where(POI.visibility == POIVisibility.public)

    # Sem ORDER BY, o Postgres não garante a mesma ordem entre execuções da
    # mesma query ST_Intersects (varredura de índice pode mudar) — isso
    # quebrava o structural sharing padrão do React Query no frontend: ele
    # reaproveita a referência antiga de cada item quando o conteúdo é igual,
    # mas só casa por posição no array, então uma reordenação faz ele tratar
    # POIs idênticos como "novos" a cada refetch. Resultado real visto em
    # produção: isso recriava os ícones de TODOS os marcadores (inclusive o
    # do popup aberto) a cada refetch, piscando o mapa inteiro mesmo sem
    # nenhum dado ter mudado de verdade. ORDER BY estável resolve na raiz.
    stmt = stmt.order_by(POI.id)

    pois = db.scalars(stmt).unique().all()
    return [_to_read(poi) for poi in pois]


@router.get(
    "/pois/by-slug/{slug}",
    response_model=POIPublicRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_poi_by_slug(slug: str, db: Session = Depends(get_db)):
    """Busca por slug pra página pública de compartilhamento (`/p/{slug}` no
    frontend, Sprint 6) — só devolve POIs com `visibility=public`; privados/
    seguidores dão 404 igual a inexistentes, pra não vazar que o slug existe.
    Declarado ANTES de `/pois/{poi_id}` no router: como "by-slug" não é um
    UUID válido, se viesse depois o FastAPI casaria a rota pelo formato do
    path primeiro e devolveria 422 (falha ao converter "by-slug" pra UUID)
    em vez de cair nesta rota."""
    row = db.execute(
        select(POI, Category, User)
        .join(Category, POI.category_id == Category.id)
        .join(User, POI.user_id == User.id)
        .options(selectinload(POI.media))
        .where(POI.slug == slug, POI.visibility == POIVisibility.public)
    ).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    poi, category, owner = row
    point = to_shape(poi.location)
    return POIPublicRead.model_validate({
        "id": poi.id,
        "name": poi.name,
        "slug": poi.slug,
        "description": poi.description,
        "address": poi.address,
        "lat": point.y,
        "lng": point.x,
        "icon_name": poi.icon_name,
        "category_name": category.name,
        "category_icon_name": category.icon_name,
        "category_color_hex": category.color_hex,
        "owner_name": owner.name,
        "owner_avatar_url": owner.avatar_choice_url or owner.avatar_url,
        "created_at": poi.created_at,
        "media": poi.media,
    })


@router.get(
    "/pois/{poi_id}",
    response_model=POIRead,
)
def get_poi(
    poi_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    if mobile_user_id is not None:
        user_id = mobile_user_id

    poi = db.scalar(_with_relations(select(POI)).where(POI.id == poi_id))
    if poi is None or not _poi_visible_to(poi, user_id, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    return _to_read(poi)


def _validate_group_membership(group_id: uuid.UUID | None, user_id: uuid.UUID, db: Session) -> uuid.UUID:
    """`visibility=group` exige um `group_id` de um grupo do qual `user_id`
    é membro ACEITO — nunca confia no `group_id` vindo do payload sem checar
    isso, senão daria pra marcar um POI como de um grupo que a pessoa nem
    faz parte."""
    if group_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="group_id is required when visibility=group",
        )
    is_member = db.scalar(
        select(GroupMember.id).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.status == GroupMemberStatus.accepted,
        )
    ) is not None
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You are not a member of this group"
        )
    return group_id


@router.post(
    "/pois",
    response_model=POIRead,
    status_code=status.HTTP_201_CREATED,
)
def create_poi(
    payload: POICreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    # Dono real do POI: o JWT mobile manda quando presente — nunca o
    # `user_id` do payload (mesma proteção de `list_pois`).
    owner_id = mobile_user_id if mobile_user_id is not None else payload.user_id

    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    # Visibilidade != group nunca guarda group_id, mesmo que o cliente tenha
    # mandado um (ex: trocou de "grupo" pra "público" no formulário sem
    # limpar o campo) — nunca confia nisso sem revalidar.
    group_id = (
        _validate_group_membership(payload.group_id, owner_id, db)
        if payload.visibility == POIVisibility.group
        else None
    )

    poi = POI(
        user_id=owner_id,
        category_id=payload.category_id,
        name=payload.name,
        slug=slugify_unique(db, payload.name),
        description=payload.description,
        address=payload.address,
        location=WKTElement(f"POINT({payload.lng} {payload.lat})", srid=4326),
        visibility=payload.visibility,
        group_id=group_id,
        icon_name=payload.icon_name,
    )
    db.add(poi)
    db.commit()
    db.refresh(poi)

    # Notifica quem segue o dono do POI — só pra `public`/`followers`. POIs
    # de grupo não entram aqui (quem segue pode nem ser membro do grupo e
    # não teria como ver o POI de qualquer forma); notificar membros do
    # grupo sobre POI novo fica fora de escopo desta parte (ver plano).
    if poi.visibility in (POIVisibility.public, POIVisibility.followers):
        follower_ids = db.scalars(
            select(Follow.follower_id).where(Follow.followed_id == poi.user_id)
        ).all()
        if follower_ids:
            db.execute(
                insert(Notification),
                [
                    {
                        "id": uuid.uuid4(),
                        "user_id": follower_id,
                        "type": NotificationType.new_poi_from_followed,
                        "actor_id": poi.user_id,
                        "poi_id": poi.id,
                        "payload": {"poi_name": poi.name},
                    }
                    for follower_id in follower_ids
                ],
            )
            db.commit()

    background_tasks.add_task(_run_categorizer_background, poi.id)
    return _to_read(poi)


@router.put(
    "/pois/{poi_id}",
    response_model=POIRead,
)
def update_poi(
    poi_id: uuid.UUID,
    payload: POIUpdate,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    actor_id = mobile_user_id if mobile_user_id is not None else payload.user_id

    poi = db.scalar(_with_relations(select(POI)).where(POI.id == poi_id))
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    data = payload.model_dump(exclude={"user_id", "lat", "lng"}, exclude_unset=True)

    if payload.lat is not None or payload.lng is not None:
        current_point = to_shape(poi.location)
        lat = payload.lat if payload.lat is not None else current_point.y
        lng = payload.lng if payload.lng is not None else current_point.x
        poi.location = WKTElement(f"POINT({lng} {lat})", srid=4326)

    if "category_id" in data and db.get(Category, data["category_id"]) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    # Mesma regra de `create_poi`: visibilidade final == group precisa de um
    # group_id validado; qualquer outra visibilidade final nunca guarda
    # group_id, mesmo que o POI já tivesse um de antes (trocar de "grupo" pra
    # outra visibilidade limpa o vínculo).
    new_visibility = data.get("visibility", poi.visibility)
    if new_visibility == POIVisibility.group:
        requested_group_id = data.get("group_id", poi.group_id)
        data["group_id"] = _validate_group_membership(requested_group_id, actor_id, db)
    else:
        data["group_id"] = None

    for field, value in data.items():
        setattr(poi, field, value)

    db.commit()
    db.refresh(poi)
    return _to_read(poi)


@router.delete(
    "/pois/{poi_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_poi(
    poi_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    actor_id = mobile_user_id if mobile_user_id is not None else user_id
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    db.delete(poi)
    db.commit()


@router.post(
    "/pois/{poi_id}/media",
    response_model=POIMediaRead,
    status_code=status.HTTP_201_CREATED,
)
def attach_poi_media(
    poi_id: uuid.UUID,
    payload: POIMediaCreate,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    actor_id = mobile_user_id if mobile_user_id is not None else payload.user_id
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    # O cliente podia ter mentido o content_type ao pedir o presigned URL e
    # mandado outros bytes no PUT direto pro R2 — só dá pra conferir tamanho
    # e Content-Type de verdade agora, com o arquivo já lá.
    try:
        verify_uploaded_object(payload.object_key, payload.media_type)
    except UploadValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    thumbnail_url = None
    if payload.media_type == MediaType.image:
        thumbnail_url = generate_image_thumbnail(payload.object_key)

    media = POIMedia(
        poi_id=poi.id,
        media_type=payload.media_type,
        url=build_public_url(payload.object_key),
        thumbnail_url=thumbnail_url,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.delete(
    "/pois/{poi_id}/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_poi_media(
    poi_id: uuid.UUID,
    media_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    actor_id = mobile_user_id if mobile_user_id is not None else user_id
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    if poi.user_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this POI")

    media = db.get(POIMedia, media_id)
    if media is None or media.poi_id != poi.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    delete_object_by_public_url(media.url)
    if media.thumbnail_url:
        delete_object_by_public_url(media.thumbnail_url)

    db.delete(media)
    db.commit()


@router.post(
    "/pois/{poi_id}/reactions",
    response_model=POIRead,
    dependencies=[Depends(verify_internal_secret)],
)
def toggle_reaction(poi_id: uuid.UUID, payload: ReactionToggle, db: Session = Depends(get_db)):
    """Alterna (adiciona/remove) a reação do usuário com esse emoji nesse POI.
    Um usuário pode reagir com vários emojis diferentes ao mesmo POI — cada
    emoji é independente (clicar de novo no mesmo remove só aquele)."""
    poi = db.get(POI, poi_id)
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")

    existing = db.scalar(
        select(PoiReaction).where(
            PoiReaction.poi_id == poi_id,
            PoiReaction.user_id == payload.user_id,
            PoiReaction.emoji == payload.emoji,
        )
    )
    if existing is not None:
        db.delete(existing)
    else:
        db.add(PoiReaction(poi_id=poi_id, user_id=payload.user_id, emoji=payload.emoji))
        # Notifica o dono do POI só ao adicionar (não ao remover) e só se não
        # for autorreação.
        if poi.user_id != payload.user_id:
            db.add(
                Notification(
                    user_id=poi.user_id,
                    type=NotificationType.poi_reaction,
                    actor_id=payload.user_id,
                    poi_id=poi.id,
                    payload={"emoji": payload.emoji, "poi_name": poi.name},
                )
            )
    db.commit()

    poi = db.scalar(_with_relations(select(POI)).where(POI.id == poi_id))
    return _to_read(poi)
