import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.poi_media import MediaType


class PresignedUploadRequest(BaseModel):
    filename: str
    content_type: str
    media_type: MediaType


class PresignedUploadResponse(BaseModel):
    upload_url: str
    object_key: str
    public_url: str


class POIMediaCreate(BaseModel):
    object_key: str
    media_type: MediaType
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada —
    # nunca é um campo que o usuário escolhe livremente no formulário.
    user_id: uuid.UUID


class POIMediaRead(BaseModel):
    id: uuid.UUID
    media_type: MediaType
    url: str
    thumbnail_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
