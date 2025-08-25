"""add rows to ticket seats (no-op placeholder)

Revision ID: add_rows_to_ticket_seats
Revises: d550f4a8c209
Create Date: 2025-08-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_rows_to_ticket_seats'
down_revision: Union[str, None] = 'd550f4a8c209'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
