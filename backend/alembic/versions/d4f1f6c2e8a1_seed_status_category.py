"""seed status category

Revision ID: d4f1f6c2e8a1
Revises: ba57b11d3c2d
Create Date: 2026-10-22 21:50:00.000000

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f1f6c2e8a1'
down_revision: Union[str, None] = 'ba57b11d3c2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# "Status": categoria pra marcar onde a pessoa está e o que está fazendo no
# momento (pedido do usuário em 22/10/2026) — não é um lugar fixo como as
# outras categorias, é mais um "check-in" pessoal.
SLUG = "status"
NAME = "Status"
ICON_NAME = "activity"
COLOR_HEX = "#FB5B8D"

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
