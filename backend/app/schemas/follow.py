from pydantic import BaseModel

from app.schemas.user import UserPublicRead


class FollowListRead(BaseModel):
    items: list[UserPublicRead]
    total: int
