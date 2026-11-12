import uuid

from pydantic import BaseModel, Field


class BioGenerateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category_name: str
    address: str | None = None
    user_notes: str | None = None
    # Injetado pelo proxy confiável do Next.js — só pra aplicar o rate limit
    # por usuário, nunca escolhido livremente pelo navegador.
    user_id: uuid.UUID


class BioGenerateResponse(BaseModel):
    bio: str


class AiSuggestionAction(BaseModel):
    user_id: uuid.UUID
