"""merge heads after add rows and updates

Revision ID: f102402de6a1
Revises: 7c2b1d8a9e10, b1a2c3d4e5f6
Create Date: 2025-08-24 16:39:10.592720

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f102402de6a1'
down_revision: Union[str, None] = ('7c2b1d8a9e10', 'b1a2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
