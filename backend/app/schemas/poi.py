import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.poi import POIVisibility
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
    visibility: POIVisibility = POIVisibility.public
    # Só relevante quando `visibility=group` — validado no endpoint (precisa
    # ser um grupo do qual `user_id` é membro aceito). Pra qualquer outra
    # visibilidade, o servidor ignora/zera isso, nunca confia no que o
    # cliente mandou.
    group_id: uuid.UUID | None = None
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
    visibility: POIVisibility | None = None
    group_id: uuid.UUID | None = None
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
    visibility: POIVisibility
    group_id: uuid.UUID | None = None
    icon_name: str | None
    # Sugestão pendente do POICategorizerAgent (Sprint 5) — não-nula só
    # enquanto o dono não aceitou/dispensou. Ver SPRINTS.md.
    ai_category_slug: str | None = None
    ai_icon_name: str | None = None
    ai_color_hex: str | None = None
    ai_confidence: float | None = None
    ai_reasoning: str | None = None
    created_at: datetime
    updated_at: datetime
    media: list[POIMediaRead] = []
    reactions: list[ReactionRead] = []
    # Nome/avatar de quem criou o POI — avatar usado no marcador do mapa em
    # vez do ícone de categoria (a borda colorida continua indicando a
    # categoria); nome exibido no card de detalhes.
    owner_name: str | None = None
    owner_avatar_url: str | None = None

    model_config = {"from_attributes": True}


class POIPublicRead(BaseModel):
    """Versão da leitura de POI pra página pública (`/p/{slug}`, Sprint 6) —
    mesma base do POIRead, mas sem `user_id` cru (troca por nome/avatar do
    dono, já resolvidos via join) e com nome/ícone/cor da categoria embutidos,
    pra a página não precisar de uma segunda chamada só pra exibir isso."""

    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    address: str | None
    lat: float
    lng: float
    icon_name: str | None
    category_name: str
    category_icon_name: str
    category_color_hex: str
    owner_name: str | None
    owner_avatar_url: str | None
    created_at: datetime
    media: list[POIMediaRead] = []

    model_config = {"from_attributes": True}
