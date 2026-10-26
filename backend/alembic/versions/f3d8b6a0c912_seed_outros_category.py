"""seed outros category

Revision ID: f3d8b6a0c912
Revises: 7a2c9e4f1b36
Create Date: 2026-10-26 10:05:00.000000

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3d8b6a0c912'
down_revision: Union[str, None] = '7a2c9e4f1b36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# "Outros": categoria-balde pra qualquer coisa que não se encaixa nas
# categorias fixas (igreja, notícia, etc. — pedido em 26/10/2026). Ícone
# padrão "sparkles" é só o fallback — cada POI nessa categoria pode escolher
# o próprio ícone (campo `pois.icon_name`, ver migration anterior).
SLUG = "outros"
NAME = "Outros"
ICON_NAME = "sparkles"
COLOR_HEX = "#9CA3AF"

categories_table = sa.table(
    "categories",
    sa.column("id", sa.UUID),
    sa.column("slug", sa.String),
    sa.column("name", sa.String),
    sa.column("icon_name", sa.String),
    sa.column("color_hex", sa.String),
)


def _category_id(slug: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"mappin.category.{slug}")


def upgrade() -> None:
    op.bulk_insert(
        categories_table,
        [
            {
                "id": _category_id(SLUG),
                "slug": SLUG,
                "name": NAME,
                "icon_name": ICON_NAME,
                "color_hex": COLOR_HEX,
            }
        ],
    )


def downgrade() -> None:
    op.execute(categories_table.delete().where(categories_table.c.slug == SLUG))
