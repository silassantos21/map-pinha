import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationRead(BaseModel):
    id: uuid.UUID
    type: NotificationType
    actor_id: uuid.UUID
    actor_name: str | None
    actor_avatar_url: str | None
    poi_id: uuid.UUID | None
    group_id: uuid.UUID | None
    group_name: str | None
    payload: dict
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListRead(BaseModel):
    items: list[NotificationRead]
    unread_count: int
