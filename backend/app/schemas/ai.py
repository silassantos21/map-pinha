import uuid
from typing import Literal

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


class RecommendationRead(BaseModel):
    poi_id: uuid.UUID
    poi_name: str
    poi_lat: float
    poi_lng: float
    category_name: str
    reason: str
    priority_score: int

    model_config = {"from_attributes": True}


class AiFeedbackCreate(BaseModel):
    poi_id: uuid.UUID
    agent: Literal["categorizer", "recommender"]
    useful: bool
    user_id: uuid.UUID


class AiSuggestionAction(BaseModel):
    user_id: uuid.UUID
