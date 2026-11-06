import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.group import GroupMemberRole, GroupMemberStatus


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada.
    owner_id: uuid.UUID


class GroupUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    user_id: uuid.UUID


class GroupInviteCreate(BaseModel):
    user_id: uuid.UUID
    # Injetado pelo proxy confiável do Next.js a partir da sessão autenticada.
    inviter_id: uuid.UUID


class GroupRead(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    owner_name: str | None
    # Só conta membros `accepted` — convites pendentes não contam como membro.
    member_count: int
    my_role: GroupMemberRole
    created_at: datetime

    model_config = {"from_attributes": True}


class GroupInviteRead(BaseModel):
    group_id: uuid.UUID
    group_name: str
    invited_by_name: str | None
    created_at: datetime


class GroupMemberRead(BaseModel):
    user_id: uuid.UUID
    name: str | None
    avatar_url: str | None
    role: GroupMemberRole
    status: GroupMemberStatus


class GroupDetailRead(GroupRead):
    members: list[GroupMemberRead]
