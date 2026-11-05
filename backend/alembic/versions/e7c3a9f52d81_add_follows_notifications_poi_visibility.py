"""add follows table, notifications table, migrate poi.is_public to visibility

Revision ID: e7c3a9f52d81
Revises: c1a4e9f6b2d3
Create Date: 2026-11-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e7c3a9f52d81'
down_revision: Union[str, None] = 'c1a4e9f6b2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Fase 7 Parte 1 (Sistema Social) — `group` entra na Parte 2 via
# `ALTER TYPE poi_visibility ADD VALUE` numa migration própria.
#
# `create_type=False` nos dois: o SQLAlchemy por padrão cria/dropa o tipo
# ENUM sozinho quando ele aparece numa coluna de `create_table`/`drop_table`
# (via evento `before_create`/`after_drop` da Table) — só que isso colide com
# qualquer `.create()`/`.drop()` explícito feito aqui (erro "already exists"
# tanto no upgrade quanto num downgrade seguido de upgrade de novo). Com
# `create_type=False`, os dois tipos só existem/deixam de existir quando esta
# migration manda explicitamente, sem surpresa do SQLAlchemy.
poi_visibility = postgresql.ENUM(
    "public", "followers", "private", name="poi_visibility", create_type=False
)
notification_type = postgresql.ENUM(
    "new_follower", "poi_reaction", "new_poi_from_followed",
    name="notification_type", create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    poi_visibility.create(bind, checkfirst=True)
    notification_type.create(bind, checkfirst=True)

    # --- pois.is_public -> pois.visibility ---------------------------------
    op.add_column("pois", sa.Column("visibility", poi_visibility, nullable=True))
    op.execute(
        "UPDATE pois SET visibility = CASE WHEN is_public THEN 'public'::poi_visibility "
        "ELSE 'private'::poi_visibility END"
    )
    op.alter_column("pois", "visibility", nullable=False)
    op.create_index(op.f("ix_pois_visibility"), "pois", ["visibility"])
    op.drop_column("pois", "is_public")

    # --- follows -------------------------------------------------------------
    op.create_table(
        "follows",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("follower_id", sa.UUID(), nullable=False),
        sa.Column("followed_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["followed_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("follower_id", "followed_id", name="uq_follow_follower_followed"),
        sa.CheckConstraint("follower_id != followed_id", name="ck_follow_no_self_follow"),
    )
    op.create_index(op.f("ix_follows_follower_id"), "follows", ["follower_id"])
    op.create_index(op.f("ix_follows_followed_id"), "follows", ["followed_id"])

    # --- notifications ---------------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=False),
        sa.Column("poi_id", sa.UUID(), nullable=True),
        sa.Column("payload", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["poi_id"], ["pois.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"])
    # Acelera a listagem paginada "recentes primeiro" e a contagem de não lidas.
    op.create_index("ix_notifications_user_id_created_at", "notifications", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id_created_at", table_name="notifications")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_table("notifications")

    op.drop_index(op.f("ix_follows_followed_id"), table_name="follows")
    op.drop_index(op.f("ix_follows_follower_id"), table_name="follows")
    op.drop_table("follows")

    op.add_column("pois", sa.Column("is_public", sa.Boolean(), nullable=True))
    op.execute("UPDATE pois SET is_public = (visibility = 'public'::poi_visibility)")
    op.alter_column("pois", "is_public", nullable=False)
    op.drop_index(op.f("ix_pois_visibility"), table_name="pois")
    op.drop_column("pois", "visibility")

    bind = op.get_bind()
    notification_type.drop(bind, checkfirst=True)
    poi_visibility.drop(bind, checkfirst=True)
