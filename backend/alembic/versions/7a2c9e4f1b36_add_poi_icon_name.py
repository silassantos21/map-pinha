"""add poi icon_name

Revision ID: 7a2c9e4f1b36
Revises: d4f1f6c2e8a1
Create Date: 2026-10-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a2c9e4f1b36'
down_revision: Union[str, None] = 'd4f1f6c2e8a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Ícone escolhido livremente pelo usuário por POI (pedido em 26/10/2026) —
# só faz sentido pra categoria "outros", que vira um "balde" sem ícone fixo
# próprio; as demais categorias continuam usando o ícone fixo delas.
# Quando nulo, o frontend cai pro ícone da categoria.


def upgrade() -> None:
    op.add_column("pois", sa.Column("icon_name", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("pois", "icon_name")
