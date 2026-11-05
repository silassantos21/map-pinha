import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.poi_media import POIMedia
    from app.models.poi_reaction import PoiReaction


class POIVisibility(str, enum.Enum):
    public = "public"
    followers = "followers"
    private = "private"
    # "group" entra na Fase 7 Parte 2, junto com a tabela `groups` e a coluna
    # `group_id` — via `ALTER TYPE poi_visibility ADD VALUE` numa migration
    # própria (não pode estar na mesma transação que já usa o valor novo).


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
    visibility: Mapped[POIVisibility] = mapped_column(
        Enum(POIVisibility, name="poi_visibility"), default=POIVisibility.public, index=True
    )
    # Ícone escolhido livremente pelo usuário (categoria "outros") — quando
    # presente, sobrepõe o ícone fixo da categoria só nesse POI.
    icon_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Sugestão do POICategorizerAgent (Sprint 5), preenchida em segundo plano
    # após criar o POI. Não-nulo = sugestão pronta pro dono aceitar/dispensar;
    # aceitar copia pra category_id/icon_name reais e limpa estes campos.
    ai_category_slug: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ai_icon_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(nullable=True)
    ai_reasoning: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # `order_by` aqui (não só no endpoint) garante ordem estável em TODO
    # lugar que carrega essas relações (`selectinload`), não só na listagem —
    # sem isso, o Postgres pode devolver `media`/`reactions` em ordens
    # diferentes entre chamadas (sem ORDER BY, a ordem de retorno não é
    # garantida), o que por sua vez quebrava o structural sharing do React
    # Query no frontend mesmo com a lista de POIs já em ordem estável: um POI
    # com 2+ mídias/reações parecia "mudado" a cada refetch só por causa da
    # ordem interna de `media`/`reactions`, recriando o ícone do marcador à
    # toa (causa real do popup "piscando" em POIs com mais de uma mídia).
    media: Mapped[list["POIMedia"]] = relationship(
        back_populates="poi", cascade="all, delete-orphan", order_by="POIMedia.created_at"
    )
    reactions: Mapped[list["PoiReaction"]] = relationship(
        cascade="all, delete-orphan", order_by="PoiReaction.created_at"
    )
