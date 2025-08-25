"""add ticket_code to tickets

Revision ID: add_ticket_code
Revises: e6f7a8b9c0d1
Create Date: 2025-08-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'add_ticket_code'
down_revision: Union[str, None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tickets', sa.Column('ticket_code', sa.String(), nullable=True))
    op.create_unique_constraint('uq_tickets_ticket_code', 'tickets', ['ticket_code'])


def downgrade() -> None:
    op.drop_constraint('uq_tickets_ticket_code', 'tickets', type_='unique')
    op.drop_column('tickets', 'ticket_code')
