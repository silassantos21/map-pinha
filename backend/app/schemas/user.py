import uuid

from pydantic import BaseModel, EmailStr


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

    model_config = {"from_attributes": True}
