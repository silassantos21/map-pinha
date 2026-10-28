"""add AI agents fields (POI suggestion columns + ai_feedback table)

Revision ID: 9b3f2a6d7c41
Revises: f3d8b6a0c912
Create Date: 2026-10-27 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9b3f2a6d7c41'
down_revision: Union[str, None] = 'f3d8b6a0c912'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('pois', sa.Column('ai_category_slug', sa.String(length=50), nullable=True))
    op.add_column('pois', sa.Column('ai_icon_name', sa.String(length=100), nullable=True))
    op.add_column('pois', sa.Column('ai_color_hex', sa.String(length=7), nullable=True))
    op.add_column('pois', sa.Column('ai_confidence', sa.Float(), nullable=True))
    op.add_column('pois', sa.Column('ai_reasoning', sa.String(length=300), nullable=True))

    op.create_table(
        'ai_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('poi_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('agent', sa.String(length=20), nullable=False),
        sa.Column('useful', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['poi_id'], ['pois.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_feedback_user_id', 'ai_feedback', ['user_id'])
    op.create_index('ix_ai_feedback_poi_id', 'ai_feedback', ['poi_id'])


def downgrade() -> None:
    op.drop_index('ix_ai_feedback_poi_id', table_name='ai_feedback')
    op.drop_index('ix_ai_feedback_user_id', table_name='ai_feedback')
    op.drop_table('ai_feedback')

    op.drop_column('pois', 'ai_reasoning')
    op.drop_column('pois', 'ai_confidence')
    op.drop_column('pois', 'ai_color_hex')
    op.drop_column('pois', 'ai_icon_name')
    op.drop_column('pois', 'ai_category_slug')
