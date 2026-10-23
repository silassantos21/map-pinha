import uuid

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    icon_name: str = Field(min_length=1, max_length=100)
    color_hex: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    icon_name: str | None = Field(default=None, min_length=1, max_length=100)
    color_hex: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryRead(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    icon_name: str
    color_hex: str

    model_config = {"from_attributes": True}
