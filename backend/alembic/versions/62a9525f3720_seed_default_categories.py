"""seed default categories

Revision ID: 62a9525f3720
Revises: 24d879e95ef3
Create Date: 2026-10-22 13:04:07.258941

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62a9525f3720'
down_revision: Union[str, None] = '24d879e95ef3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Categorias do MVP (ver docs/02_TECH_STACK.md escopo MVP e docs/03_AI_AGENTS.md
# POICategorizerAgent). Cores iguais aos tokens --category-* do frontend
# (frontend/src/app/globals.css) e ícones nomeados conforme o set lucide-react.
CATEGORIES = [
    ("alimentacao", "Alimentação", "utensils", "#FF7A50"),
    ("comercio", "Comércio", "store", "#4A90FF"),
    ("saude", "Saúde", "stethoscope", "#22D3B8"),
    ("lazer", "Lazer", "trees", "#9BE15D"),
    ("entretenimento", "Entretenimento", "drama", "#D15BFF"),
    ("residencial", "Residencial", "home", "#FFC94A"),
]

categories_table = sa.table(
    "categories",
    sa.column("id", sa.UUID),
    sa.column("slug", sa.String),
    sa.column("name", sa.String),
    sa.column("icon_name", sa.String),
    sa.column("color_hex", sa.String),
)


def _category_id(slug: str) -> uuid.UUID:
    # Determinístico: mesmo slug sempre gera o mesmo UUID, útil pra referenciar
    # categorias em fixtures/seeds do frontend sem precisar consultar o banco.
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"mappin.category.{slug}")


def upgrade() -> None:
    op.bulk_insert(
        categories_table,
        [
            {
                "id": _category_id(slug),
                "slug": slug,
                "name": name,
                "icon_name": icon_name,
                "color_hex": color_hex,
            }
            for slug, name, icon_name, color_hex in CATEGORIES
        ],
    )


def downgrade() -> None:
    op.execute(
        categories_table.delete().where(
            categories_table.c.slug.in_([slug for slug, *_ in CATEGORIES])
        )
    )
