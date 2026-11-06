"""add groups, group_members, group_id on pois/notifications, poi_visibility/notification_type gain 'group'/'group_invite'

Revision ID: 632a1944c5ad
Revises: e7c3a9f52d81
Create Date: 2026-11-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '632a1944c5ad'
down_revision: Union[str, None] = 'e7c3a9f52d81'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Fase 7 Parte 2 (Grupos). Dois ENUMs ganham um valor novo via
# `ALTER TYPE ... ADD VALUE IF NOT EXISTS` — decisão consciente (ver
# SPRINTS.md/plano da sessão): isso é IRREVERSÍVEL de verdade no Postgres,
# que não tem `ALTER TYPE ... DROP VALUE`. O `downgrade()` abaixo reverte os
# DADOS que usam o valor novo (volta pra `private`, por exemplo) e remove as
# tabelas/colunas desta migration, mas os literais `'group'` e
# `'group_invite'` continuam existindo nos tipos `poi_visibility`/
# `notification_type` do Postgres depois de um downgrade. Reverter isso de
# verdade exigiria renomear o tipo, recriar sem o valor e fazer
# `ALTER COLUMN ... USING` — desproporcional pra este projeto (solo,
# portfólio); não fazer isso é a decisão, não um descuido.
group_member_role = postgresql.ENUM(
    "owner", "member", name="group_member_role", create_type=False
)
group_member_status = postgresql.ENUM(
    "pending", "accepted", name="group_member_status", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    group_member_role.create(bind, checkfirst=True)
    group_member_status.create(bind, checkfirst=True)

    op.execute("ALTER TYPE poi_visibility ADD VALUE IF NOT EXISTS 'group'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_invite'")

    # --- groups ----------------------------------------------------------------
    op.create_table(
        "groups",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_groups_owner_id"), "groups", ["owner_id"])

    # --- group_members -----------------------------------------------------------
    op.create_table(
        "group_members",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("group_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", group_member_role, server_default="member", nullable=False),
        sa.Column("status", group_member_status, server_default="pending", nullable=False),
        sa.Column("invited_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id", "user_id", name="uq_group_member_group_user"),
    )
    op.create_index(op.f("ix_group_members_group_id"), "group_members", ["group_id"])
    op.create_index(op.f("ix_group_members_user_id"), "group_members", ["user_id"])

    # --- pois.group_id -----------------------------------------------------------
    op.add_column("pois", sa.Column("group_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_pois_group_id_groups", "pois", "groups", ["group_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index(op.f("ix_pois_group_id"), "pois", ["group_id"])

    # --- notifications.group_id ---------------------------------------------------
    op.add_column("notifications", sa.Column("group_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_notifications_group_id_groups", "notifications", "groups", ["group_id"], ["id"], ondelete="CASCADE"
    )


def downgrade() -> None:
    op.drop_constraint("fk_notifications_group_id_groups", "notifications", type_="foreignkey")
    op.drop_column("notifications", "group_id")

    op.drop_index(op.f("ix_pois_group_id"), table_name="pois")
    op.drop_constraint("fk_pois_group_id_groups", "pois", type_="foreignkey")
    # POIs com visibility='group' não têm mais pra onde apontar depois que a
    # coluna cai — volta pra 'private' (mesmo espírito do backfill de
    # is_public->visibility da migration anterior: não pode sumir POI
    # nenhum, só muda quem enxerga).
    op.execute("UPDATE pois SET visibility = 'private' WHERE visibility = 'group'")
    op.drop_column("pois", "group_id")

    op.drop_index(op.f("ix_group_members_user_id"), table_name="group_members")
    op.drop_index(op.f("ix_group_members_group_id"), table_name="group_members")
    op.drop_table("group_members")

    op.drop_index(op.f("ix_groups_owner_id"), table_name="groups")
    op.drop_table("groups")

    bind = op.get_bind()
    group_member_status.drop(bind, checkfirst=True)
    group_member_role.drop(bind, checkfirst=True)

    # 'group'/'group_invite' continuam nos tipos poi_visibility/
    # notification_type depois daqui — ver nota no topo do arquivo.
