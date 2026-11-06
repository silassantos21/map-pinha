import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.shape import to_shape
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import verify_internal_secret
from app.core.avatar_presets import (
    ALLOWED_AVATAR_UPLOAD_EXTENSIONS,
    avatar_preset_url,
    avatar_upload_object_key,
    avatar_upload_prefix,
    is_custom_avatar_upload,
    list_avatar_presets,
)
from app.core.media_processing import InvalidAvatarUpload, process_avatar_upload
from app.core.rate_limit import enforce_ai_rate_limit
from app.core.storage import create_presigned_upload_url, delete_object_by_public_url
from app.db.session import get_db
from app.models.category import Category
from app.models.follow import Follow
from app.models.poi import POI, POIVisibility
from app.models.route import Route
from app.models.user import User
from app.schemas.poi import POIPublicRead
from app.schemas.user import (
    AvatarPresetRead,
    AvatarUploadPresignedResponse,
    AvatarUploadRequest,
    UserAvatarUpdate,
    UserProfileRead,
    UserRead,
)

router = APIRouter()


class UserStatsRead(BaseModel):
    total_pois: int
    total_km: float


@router.get(
    "/users/{user_id}/stats",
    response_model=UserStatsRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_user_stats(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Estatísticas da página de perfil (Sprint 6): total de POIs cadastrados
    + km mapeados (soma das distâncias de todas as rotas calculadas pelo
    usuário, tabela `routes` — cache de rotas da Sprint 4). Não exige que o
    POI ainda exista: uma rota calculada pra um POI depois excluído ainda
    conta pro total de km, já que a "jornada" aconteceu de verdade."""
    total_pois = db.scalar(select(func.count(POI.id)).where(POI.user_id == user_id)) or 0
    total_m = db.scalar(
        select(func.coalesce(func.sum(Route.distance_m), 0)).where(Route.user_id == user_id)
    ) or 0
    return UserStatsRead(total_pois=total_pois, total_km=round(total_m / 1000, 1))


@router.get(
    "/users/{user_id}/profile",
    response_model=UserProfileRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_user_profile(
    user_id: uuid.UUID, viewer_id: uuid.UUID | None = None, db: Session = Depends(get_db)
):
    """Perfil público de outro usuário (Fase 7) — nome/avatar/contagens, nunca
    `email`. Reaproveita a mesma query de `total_pois` de `get_user_stats`."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    followers_count = db.scalar(
        select(func.count(Follow.id)).where(Follow.followed_id == user_id)
    ) or 0
    following_count = db.scalar(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    ) or 0
    total_pois = db.scalar(select(func.count(POI.id)).where(POI.user_id == user_id)) or 0

    is_following = None
    if viewer_id is not None and viewer_id != user_id:
        is_following = db.scalar(
            select(Follow.id).where(Follow.follower_id == viewer_id, Follow.followed_id == user_id)
        ) is not None

    return UserProfileRead(
        id=user.id,
        name=user.name,
        avatar_url=user.avatar_url,
        avatar_choice_url=user.avatar_choice_url,
        is_following=is_following,
        followers_count=followers_count,
        following_count=following_count,
        total_pois=total_pois,
    )


@router.get(
    "/users/{user_id}/pois",
    response_model=list[POIPublicRead],
    dependencies=[Depends(verify_internal_secret)],
)
def list_user_pois(
    user_id: uuid.UUID, viewer_id: uuid.UUID | None = None, db: Session = Depends(get_db)
):
    """POIs de um usuário pra exibir no perfil dele (Fase 7) — mesma regra de
    visibilidade de `_poi_visible_to` em `pois.py`, só que restrita a um
    único dono em vez do mapa inteiro: públicos sempre, `followers` só se
    `viewer_id` seguir esse usuário, privados nunca (nem pro próprio dono
    vendo o perfil dele mesmo por essa rota — essa tela não existe hoje, mas
    se existir um dia, é só passar `viewer_id == user_id` que já funciona:
    ver o `if` abaixo)."""
    stmt = (
        select(POI, Category)
        .join(Category, POI.category_id == Category.id)
        .where(POI.user_id == user_id)
        .options(selectinload(POI.media))
        .order_by(POI.created_at.desc(), POI.id.desc())
    )

    if viewer_id == user_id:
        allowed = [POIVisibility.public, POIVisibility.followers, POIVisibility.private]
    else:
        follows_owner = viewer_id is not None and db.scalar(
            select(Follow.id).where(Follow.follower_id == viewer_id, Follow.followed_id == user_id)
        ) is not None
        allowed = [POIVisibility.public]
        if follows_owner:
            allowed.append(POIVisibility.followers)
    stmt = stmt.where(POI.visibility.in_(allowed))

    rows = db.execute(stmt).all()
    owner = db.get(User, user_id)
    owner_name = owner.name if owner else None
    owner_avatar_url = (owner.avatar_choice_url or owner.avatar_url) if owner else None

    return [
        POIPublicRead.model_validate({
            "id": poi.id,
            "name": poi.name,
            "slug": poi.slug,
            "description": poi.description,
            "address": poi.address,
            "lat": to_shape(poi.location).y,
            "lng": to_shape(poi.location).x,
            "icon_name": poi.icon_name,
            "category_name": category.name,
            "category_icon_name": category.icon_name,
            "category_color_hex": category.color_hex,
            "owner_name": owner_name,
            "owner_avatar_url": owner_avatar_url,
            "created_at": poi.created_at,
            "media": poi.media,
        })
        for poi, category in rows
    ]


@router.get("/users/avatar-presets", response_model=list[AvatarPresetRead])
def get_avatar_presets():
    """Galeria fixa de avatares pré-gerados (Fase 9) — sem autenticação, são
    só URLs públicas do bucket R2, as mesmas pra todo mundo."""
    return list_avatar_presets()


@router.get(
    "/users/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(verify_internal_secret)],
)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post(
    "/users/{user_id}/avatar/presigned-url",
    response_model=AvatarUploadPresignedResponse,
    dependencies=[Depends(verify_internal_secret)],
)
def create_avatar_presigned_url(
    user_id: uuid.UUID, payload: AvatarUploadRequest, db: Session = Depends(get_db)
):
    """URL pré-assinada pra enviar uma foto de perfil própria direto pro R2
    (mesmo padrão de `POST /media/presigned-url`, usado pra mídia de POI) —
    endpoint próprio, não reaproveitado, porque aqui a chave do objeto fica
    isolada por usuário (`avatars/uploads/{user_id}/...`) e com limite diário
    (10/dia): diferente de mídia de POI, uma foto de perfil é vista em todo
    lugar que mostra o usuário (marcador, card de detalhes, busca, perfil),
    então upload demais merece mais cautela aqui do que lá."""
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    enforce_ai_rate_limit(user_id, "avatar_upload", limit=10)

    extension = payload.filename.rsplit(".", 1)[-1].lower() if "." in payload.filename else ""
    if extension not in ALLOWED_AVATAR_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extensão de arquivo não permitida (use .jpg, .png ou .webp)",
        )

    object_key = avatar_upload_object_key(user_id, extension)
    upload_url = create_presigned_upload_url(object_key, payload.content_type)
    return AvatarUploadPresignedResponse(upload_url=upload_url, object_key=object_key)


@router.patch(
    "/users/{user_id}/avatar",
    response_model=UserRead,
    dependencies=[Depends(verify_internal_secret)],
)
def update_user_avatar(user_id: uuid.UUID, payload: UserAvatarUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    previous_avatar_choice_url = user.avatar_choice_url

    if payload.object_key is not None:
        # Nunca aceita o object_key "cru": precisa estar dentro do prefixo
        # deste usuário, senão alguém poderia tentar apontar o próprio avatar
        # pra uma chave de outra pessoa (ou de mídia de POI) só adivinhando a
        # URL. `process_avatar_upload` baixa o objeto, confere tamanho/
        # formato de verdade (o Content-Type declarado no upload não é
        # confiável sozinho) e devolve a URL já processada (quadrada, WEBP,
        # sem EXIF) — nunca a do upload bruto.
        if not payload.object_key.startswith(avatar_upload_prefix(user_id)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="object_key inválido")
        try:
            user.avatar_choice_url = process_avatar_upload(
                payload.object_key, avatar_upload_prefix(user_id)
            )
        except InvalidAvatarUpload as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    else:
        # `preset_id` já validado contra a faixa 1-20 no schema (Field ge/le)
        # — a URL é sempre montada aqui no servidor a partir de um preset
        # conhecido, nunca aceita uma URL arbitrária vinda do cliente.
        # `None` remove a escolha e volta pra foto do Google (`avatar_url`).
        user.avatar_choice_url = avatar_preset_url(payload.preset_id) if payload.preset_id else None

    db.commit()
    db.refresh(user)

    # Limpeza: se a escolha anterior era um upload próprio (nunca um preset,
    # que é compartilhado), apaga o objeto velho do R2 — senão toda troca de
    # avatar deixa um arquivo órfão pra sempre. Depois do commit, pra nunca
    # apagar um objeto que ainda está em uso se o commit falhar.
    if is_custom_avatar_upload(previous_avatar_choice_url, user_id):
        if previous_avatar_choice_url != user.avatar_choice_url:
            delete_object_by_public_url(previous_avatar_choice_url)

    return user
