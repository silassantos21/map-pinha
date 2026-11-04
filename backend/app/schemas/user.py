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
