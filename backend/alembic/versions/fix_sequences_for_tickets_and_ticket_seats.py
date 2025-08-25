"""fix sequences for tickets and ticket_seats (no-op placeholder)

Revision ID: b1a2c3d4e5f6
Revises: aa6efabd38a7
Create Date: 2025-08-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b1a2c3d4e5f6'
down_revision: Union[str, None] = 'aa6efabd38a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # sequences already fixed earlier; keeping as no-op
    pass


def downgrade() -> None:
    # no-op
    pass
