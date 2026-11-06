import uuid

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.core.avatar_presets import ALLOWED_AVATAR_UPLOAD_CONTENT_TYPES, AVATAR_PRESET_COUNT


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
    # Os três campos são mutuamente exclusivos — ver `_check_single_choice`.
    # Todos `None` = remove a escolha e volta a usar a foto do Google
    # (`avatar_url`).
    preset_id: int | None = Field(default=None, ge=1, le=AVATAR_PRESET_COUNT)
    # Chave do objeto já processado por `process_avatar_upload` — nunca uma
    # URL arbitrária vinda do cliente, só a chave que o próprio backend
    # devolveu na resposta do upload.
    object_key: str | None = None

    @model_validator(mode="after")
    def _check_single_choice(self) -> "UserAvatarUpdate":
        if self.preset_id is not None and self.object_key is not None:
            raise ValueError("Informe preset_id OU object_key, não os dois")
        return self


class AvatarPresetRead(BaseModel):
    preset_id: int
    url: str


class AvatarUploadRequest(BaseModel):
    filename: str = Field(max_length=255)
    content_type: str

    @model_validator(mode="after")
    def _check_content_type(self) -> "AvatarUploadRequest":
        if self.content_type not in ALLOWED_AVATAR_UPLOAD_CONTENT_TYPES:
            raise ValueError("Tipo de arquivo não permitido (use JPG, PNG ou WEBP)")
        return self


class AvatarUploadPresignedResponse(BaseModel):
    upload_url: str
    object_key: str


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
