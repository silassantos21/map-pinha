import uuid

from pydantic import BaseModel, EmailStr, Field

from app.core.avatar_presets import AVATAR_PRESET_COUNT


class UserSyncRequest(BaseModel):
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None
    google_id: str


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    avatar_url: str | None
    avatar_choice_url: str | None

    model_config = {"from_attributes": True}


class UserAvatarUpdate(BaseModel):
    # None = remove a escolha e volta a usar a foto do Google (`avatar_url`).
    preset_id: int | None = Field(default=None, ge=1, le=AVATAR_PRESET_COUNT)


class AvatarPresetRead(BaseModel):
    preset_id: int
    url: str


class UserPublicRead(BaseModel):
    """Versão de usuário pra exibir OUTRA pessoa (busca, perfil, listas de
    seguidores/seguindo) — nunca inclui `email`. `UserRead` (acima) continua
    reservado pro próprio usuário, chamado pelo BFF só com `session.user.id`."""

    id: uuid.UUID
    name: str | None
    avatar_url: str | None
    avatar_choice_url: str | None
    # None quando não há viewer (não logado, ou perfil do próprio viewer).
    is_following: bool | None = None

    model_config = {"from_attributes": True}


class UserProfileRead(UserPublicRead):
    followers_count: int
    following_count: int
    total_pois: int
