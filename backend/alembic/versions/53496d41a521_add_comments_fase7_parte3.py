"""add comments table, notification_type gains 'poi_comment'

Revision ID: 53496d41a521
Revises: 632a1944c5ad
Create Date: 2026-11-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '53496d41a521'
down_revision: Union[str, None] = '632a1944c5ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Fase 7 Parte 3 (Comentários). Mesma limitação já documentada nas duas
# migrations anteriores que estenderam ENUMs nativos do Postgres: não existe
# `ALTER TYPE ... DROP VALUE`, então `'poi_comment'` continua existindo em
# `notification_type` mesmo depois de um `downgrade()` — decisão consciente,
# não descuido (ver `632a1944c5ad`/`e7c3a9f52d81` pro mesmo raciocínio).


def upgrade() -> None:
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'poi_comment'")

    op.create_table(
        "comments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("poi_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["poi_id"], ["pois.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_poi_id"), "comments", ["poi_id"])
    op.create_index(op.f("ix_comments_user_id"), "comments", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_comments_user_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_poi_id"), table_name="comments")
    op.drop_table("comments")

    # 'poi_comment' continua no tipo notification_type depois daqui — ver
    # nota no topo do arquivo.
