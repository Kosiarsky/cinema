"""merge multiple heads into one

Revision ID: 7c2b1d8a9e10
Revises: add_hall_to_schedules, add_identity_to_ticket_ids, add_rows_to_ticket_seats
Create Date: 2025-08-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7c2b1d8a9e10'
down_revision = ('add_hall_to_schedules', 'add_identity_to_ticket_ids', 'add_rows_to_ticket_seats')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
