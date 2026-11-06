import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, enum.Enum):
    new_follower = "new_follower"
    poi_reaction = "poi_reaction"
    new_poi_from_followed = "new_poi_from_followed"
    group_invite = "group_invite"
    # `poi_comment` (Fase 7 Parte 3) entra depois via `ALTER TYPE
    # notification_type ADD VALUE` numa migration própria.


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Quem recebe a notificação.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type")
    )
    # Quem causou o evento (novo seguidor, quem reagiu, quem criou o POI).
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    # POI relacionado (reação, POI novo) — nulo pra "novo seguidor"/"convite
    # de grupo".
    poi_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pois.id", ondelete="CASCADE"), nullable=True
    )
    # Grupo relacionado (convite de grupo) — nulo pros demais tipos.
    # `CASCADE`: excluir o grupo também limpa as notificações de convite dele
    # (diferente de `pois.group_id`, que é `SET NULL` — aqui não faz sentido
    # manter uma notificação de convite pra um grupo que não existe mais).
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=True
    )
    # Dados denormalizados pra renderizar a notificação sem join extra por
    # item da lista (ex: {"emoji": "👍", "poi_name": "..."}).
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # `foreign_keys` explícito: há duas FKs pra `users.id` (user_id e
    # actor_id), o SQLAlchemy não consegue desambiguar sem essa dica.
    actor: Mapped["User"] = relationship(foreign_keys=[actor_id])
