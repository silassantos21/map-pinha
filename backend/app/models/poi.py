import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.poi_media import POIMedia
    from app.models.poi_reaction import PoiReaction


class POI(Base):
    __tablename__ = "pois"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # GeoAlchemy2 já cria o índice espacial GIST automaticamente nesta coluna
    location: Mapped[str] = mapped_column(Geography(geometry_type="POINT", srid=4326))
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    # Ícone escolhido livremente pelo usuário (categoria "outros") — quando
    # presente, sobrepõe o ícone fixo da categoria só nesse POI.
    icon_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    media: Mapped[list["POIMedia"]] = relationship(
        back_populates="poi", cascade="all, delete-orphan"
    )
    reactions: Mapped[list["PoiReaction"]] = relationship(cascade="all, delete-orphan")
