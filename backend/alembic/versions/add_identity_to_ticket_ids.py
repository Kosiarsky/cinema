"""add identity to ticket ids (no-op placeholder)

Revision ID: add_identity_to_ticket_ids
Revises: a8d6e9d61863
Create Date: 2025-08-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_identity_to_ticket_ids'
down_revision: Union[str, None] = 'a8d6e9d61863'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
