import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class GroupMemberRole(str, enum.Enum):
    owner = "owner"
    member = "member"


class GroupMemberStatus(str, enum.Enum):
    # Convite precisa ser aceito/recusado (confirmado com o dono do projeto,
    # Fase 7 Parte 2) — diferente de seguir, que é imediato. Recusar um
    # convite e sair de um grupo já aceito são a mesma ação na prática (ver
    # `DELETE /groups/{id}/members/{user_id}`): só apaga a linha.
    pending = "pending"
    accepted = "accepted"


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100))
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    owner: Mapped["User"] = relationship()


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_member_group_user"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[GroupMemberRole] = mapped_column(
        Enum(GroupMemberRole, name="group_member_role"), default=GroupMemberRole.member
    )
    status: Mapped[GroupMemberStatus] = mapped_column(
        Enum(GroupMemberStatus, name="group_member_status"), default=GroupMemberStatus.pending
    )
    # Quem convidou (só o dono pode convidar nesta versão, mas guardar
    # explícito deixa a porta aberta pra outros papéis convidarem no futuro
    # sem precisar de migration nova).
    invited_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # `foreign_keys` explícito: há duas FKs pra `users.id` (user_id e
    # invited_by), o SQLAlchemy não consegue desambiguar sem essa dica (mesmo
    # motivo de `Notification.actor`).
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
