import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased, selectinload

from app.api.v1.pois import _to_read, _with_relations
from app.core.security import require_internal_secret_or_mobile_user
from app.db.session import get_db
from app.models.group import Group, GroupMember, GroupMemberRole, GroupMemberStatus
from app.models.notification import Notification, NotificationType
from app.models.poi import POI
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupDetailRead,
    GroupInviteCreate,
    GroupInviteRead,
    GroupMemberRead,
    GroupRead,
    GroupUpdate,
)
from app.schemas.poi import POIRead

router = APIRouter()


def _member_count(db: Session, group_id: uuid.UUID) -> int:
    return db.scalar(
        select(func.count(GroupMember.id)).where(
            GroupMember.group_id == group_id, GroupMember.status == GroupMemberStatus.accepted
        )
    ) or 0


def _my_role(db: Session, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupMemberRole | None:
    """`None` se `user_id` não for membro ACEITO deste grupo — usado tanto
    pra exibir o papel quanto como checagem de acesso (grupo "fechado": quem
    não é membro aceito não enxerga nada sobre ele, nem convite pendente)."""
    return db.scalar(
        select(GroupMember.role).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.status == GroupMemberStatus.accepted,
        )
    )


def _to_group_read(db: Session, group: Group, user_id: uuid.UUID) -> GroupRead:
    return GroupRead(
        id=group.id,
        name=group.name,
        owner_id=group.owner_id,
        owner_name=group.owner.name,
        member_count=_member_count(db, group.id),
        my_role=_my_role(db, group.id, user_id) or GroupMemberRole.member,
        created_at=group.created_at,
    )


@router.post("/groups", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    owner_id = mobile_user_id if mobile_user_id is not None else payload.owner_id
    group = Group(name=payload.name, owner_id=owner_id)
    db.add(group)
    db.flush()  # precisa de group.id antes de criar o GroupMember do dono
    db.add(
        GroupMember(
            group_id=group.id,
            user_id=owner_id,
            role=GroupMemberRole.owner,
            status=GroupMemberStatus.accepted,
            invited_by=owner_id,
            responded_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    db.refresh(group)
    return _to_group_read(db, group, owner_id)


@router.get("/groups", response_model=list[GroupRead])
def list_my_groups(
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    """Meus grupos — só os que já aceitei (convite pendente não conta como
    "meu grupo" ainda, aparece em `GET /groups/invites`)."""
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    stmt = (
        select(Group)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == user_id, GroupMember.status == GroupMemberStatus.accepted)
        .options(selectinload(Group.owner))
        .order_by(Group.created_at.desc(), Group.id)
    )
    groups = db.scalars(stmt).unique().all()
    return [_to_group_read(db, g, user_id) for g in groups]


@router.get("/groups/invites", response_model=list[GroupInviteRead])
def list_pending_invites(
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    """Declarado ANTES de `/groups/{group_id}` no router: como "invites" não
    é um UUID válido, se viesse depois o FastAPI casaria a rota pelo formato
    do path primeiro e devolveria 422 em vez de cair aqui — mesmo cuidado já
    documentado pra `/pois/by-slug/{slug}` vs `/pois/{poi_id}` e `/users/
    search` vs `/users/{user_id}`."""
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    inviter = aliased(User)
    stmt = (
        select(GroupMember, Group, inviter)
        .join(Group, Group.id == GroupMember.group_id)
        .join(inviter, inviter.id == GroupMember.invited_by)
        .where(GroupMember.user_id == user_id, GroupMember.status == GroupMemberStatus.pending)
        .order_by(GroupMember.created_at.desc())
    )
    rows = db.execute(stmt).all()
    return [
        GroupInviteRead(
            group_id=group.id,
            group_name=group.name,
            invited_by_name=inviter_user.name,
            created_at=member.created_at,
        )
        for member, group, inviter_user in rows
    ]


@router.get("/groups/{group_id}", response_model=GroupDetailRead)
def get_group_detail(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    group = db.get(Group, group_id)
    # Grupo "fechado": quem não é membro aceito recebe o mesmo 404 de "não
    # existe" — não dá pra nem confirmar que o grupo existe de fora.
    if group is None or _my_role(db, group_id, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    rows = db.execute(
        select(GroupMember, User)
        .join(User, User.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.created_at)
    ).all()
    members = [
        GroupMemberRead(
            user_id=member_user.id,
            name=member_user.name,
            avatar_url=member_user.avatar_choice_url or member_user.avatar_url,
            role=gm.role,
            status=gm.status,
        )
        for gm, member_user in rows
    ]
    base = _to_group_read(db, group, user_id)
    return GroupDetailRead(**base.model_dump(), members=members)


@router.get("/groups/{group_id}/pois", response_model=list[POIRead])
def list_group_pois(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    """POIs marcados como `visibility=group` pra este grupo especificamente —
    mesmo cuidado de grupo "fechado" de `get_group_detail`: quem não é
    membro aceito recebe 404, nem confirma que o grupo existe."""
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    group = db.get(Group, group_id)
    if group is None or _my_role(db, group_id, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    stmt = (
        _with_relations(select(POI))
        .where(POI.group_id == group_id)
        .order_by(POI.created_at.desc(), POI.id)
    )
    pois = db.scalars(stmt).unique().all()
    return [_to_read(p) for p in pois]


@router.put("/groups/{group_id}", response_model=GroupRead)
def update_group(
    group_id: uuid.UUID,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    actor_id = mobile_user_id if mobile_user_id is not None else payload.user_id
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if group.owner_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this group")

    group.name = payload.name
    db.commit()
    db.refresh(group)
    return _to_group_read(db, group, actor_id)


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    actor_id = mobile_user_id if mobile_user_id is not None else user_id
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if group.owner_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this group")

    db.delete(group)
    db.commit()


@router.post("/groups/{group_id}/members", status_code=status.HTTP_204_NO_CONTENT)
def invite_member(
    group_id: uuid.UUID,
    payload: GroupInviteCreate,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
):
    inviter_id = mobile_user_id if mobile_user_id is not None else payload.inviter_id
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if group.owner_id != inviter_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can invite members"
        )
    if payload.user_id == group.owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner is already a member")
    if db.get(User, payload.user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id, GroupMember.user_id == payload.user_id
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This person is already invited or already a member",
        )

    db.add(
        GroupMember(
            group_id=group_id,
            user_id=payload.user_id,
            role=GroupMemberRole.member,
            status=GroupMemberStatus.pending,
            invited_by=inviter_id,
        )
    )
    db.add(
        Notification(
            user_id=payload.user_id,
            type=NotificationType.group_invite,
            actor_id=inviter_id,
            group_id=group_id,
            payload={"group_name": group.name},
        )
    )
    db.commit()


@router.post(
    "/groups/{group_id}/members/{member_user_id}/accept",
    status_code=status.HTTP_204_NO_CONTENT,
)
def accept_invite(
    group_id: uuid.UUID,
    member_user_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    if member_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Can only accept your own invite"
        )

    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id, GroupMember.user_id == user_id
        )
    )
    if member is None or member.status != GroupMemberStatus.pending:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No pending invite found")

    group = db.get(Group, group_id)
    member.status = GroupMemberStatus.accepted
    member.responded_at = datetime.now(timezone.utc)
    # Avisa o dono do grupo (sempre quem convidou — só ele pode convidar,
    # ver `invite_member`) de que o convite foi aceito. Inverso de
    # `group_invite`, que avisa o convidado na hora do convite.
    db.add(
        Notification(
            user_id=group.owner_id,
            type=NotificationType.group_invite_accepted,
            actor_id=user_id,
            group_id=group_id,
            payload={"group_name": group.name},
        )
    )
    db.commit()


@router.delete("/groups/{group_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_or_leave_member(
    group_id: uuid.UUID,
    member_user_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    requester_id: uuid.UUID | None = None,
):
    """Um único endpoint cobre recusar convite, sair do grupo e o dono
    remover alguém — todos "apagar a linha de `group_members`"."""
    requester_id = mobile_user_id if mobile_user_id is not None else requester_id
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if member_user_id == group.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner cannot leave or be removed — delete the group instead",
        )
    if requester_id != member_user_id and requester_id != group.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id, GroupMember.user_id == member_user_id
        )
    )
    if member is not None:
        db.delete(member)
        db.commit()
