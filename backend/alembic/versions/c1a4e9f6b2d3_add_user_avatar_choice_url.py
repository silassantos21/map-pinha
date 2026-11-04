"""add user avatar_choice_url

Revision ID: c1a4e9f6b2d3
Revises: 9b3f2a6d7c41
Create Date: 2026-11-04 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a4e9f6b2d3'
down_revision: Union[str, None] = '9b3f2a6d7c41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Avatar pré-definido escolhido pelo usuário (Fase 9) — separado de
# `avatar_url` porque esse é sobrescrito a cada login pela foto do Google
# (`sync_user`). Guarda a URL pública já pronta, não o preset_id: evita
# reconstruir a URL em toda leitura.


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_choice_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_choice_url")
