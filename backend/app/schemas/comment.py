import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada.
    user_id: uuid.UUID


class CommentRead(BaseModel):
    id: uuid.UUID
    poi_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None
    user_avatar_url: str | None
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentListRead(BaseModel):
    items: list[CommentRead]
    total: int
