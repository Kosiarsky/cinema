"""
Merge heads after add_reviews_table and add_two_factor_to_users

Revision ID: merge_reviews_2fa
Revises: add_reviews_table, add_two_factor_to_users
Create Date: 2025-08-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'merge_reviews_2fa'
down_revision: Union[str, Sequence[str], None] = ('add_reviews_table', 'add_two_factor_to_users')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge revision; no schema changes required.
    pass


def downgrade() -> None:
    # No-op for merge revision.
    pass
