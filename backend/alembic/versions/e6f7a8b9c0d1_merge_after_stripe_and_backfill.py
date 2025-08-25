"""merge heads after stripe session id and backfill hall

Revision ID: e6f7a8b9c0d1
Revises: add_stripe_session_id, 0d4751008255
Create Date: 2025-08-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = ('add_stripe_session_id', '0d4751008255')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This is a merge migration; no schema changes required.
    pass


def downgrade() -> None:
    # This is a merge migration; no downgrade steps.
    pass
