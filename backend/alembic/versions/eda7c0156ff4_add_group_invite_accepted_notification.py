"""notification_type gains 'group_invite_accepted'

Revision ID: eda7c0156ff4
Revises: 53496d41a521
Create Date: 2026-11-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'eda7c0156ff4'
down_revision: Union[str, None] = '53496d41a521'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Avisa o DONO do grupo quando alguém aceita um convite (o inverso de
# `group_invite`, que avisa o convidado). Mesma limitação já documentada nas
# migrations anteriores que estenderam ENUMs nativos do Postgres: não existe
# `ALTER TYPE ... DROP VALUE`, então `downgrade()` não remove o valor novo.


def upgrade() -> None:
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_invite_accepted'")


def downgrade() -> None:
    # 'group_invite_accepted' continua no tipo notification_type depois
    # daqui — ver nota no topo do arquivo.
    pass
