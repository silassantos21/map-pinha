import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.media import POIMediaRead


class ReactionToggle(BaseModel):
    emoji: str = Field(min_length=1, max_length=16)
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada.
    user_id: uuid.UUID


class ReactionRead(BaseModel):
    emoji: str
    user_id: uuid.UUID
    user_name: str | None

    model_config = {"from_attributes": True}


class POICreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    address: str | None = Field(default=None, max_length=500)
    category_id: uuid.UUID
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    is_public: bool = True
    # Ícone escolhido livremente pelo usuário (só faz sentido na categoria
    # "outros" — as demais usam o ícone fixo da própria categoria). Nome de
    # ícone do lucide-react em kebab-case, igual ao `icon_name` de categoria.
    icon_name: str | None = Field(default=None, max_length=100)
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada —
    # nunca é um campo que o usuário escolhe livremente no formulário.
    user_id: uuid.UUID


class POIUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    address: str | None = Field(default=None, max_length=500)
    category_id: uuid.UUID | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    is_public: bool | None = None
    icon_name: str | None = Field(default=None, max_length=100)
    # Quem está pedindo a alteração — usado só para o check de dono, injetado
    # pelo proxy confiável do Next.js.
    user_id: uuid.UUID


class POIRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    address: str | None
    lat: float
    lng: float
    is_public: bool
    icon_name: str | None
    created_at: datetime
    updated_at: datetime
    media: list[POIMediaRead] = []
    reactions: list[ReactionRead] = []

    model_config = {"from_attributes": True}
