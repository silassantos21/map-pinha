import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Avatar pré-definido escolhido pelo usuário (Fase 9) — campo separado de
    # `avatar_url` porque esse é sobrescrito a cada login pela foto do Google
    # (ver `sync_user`); quando preenchido, tem prioridade sobre `avatar_url`
    # em toda exibição. Guarda a URL pública já pronta (não o preset_id), pra
    # não precisar reconstruir a URL toda vez que o avatar é lido.
    avatar_choice_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Credentials Provider (email/senha) — null quando o usuário entra só via Google
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
