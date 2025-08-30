"""merge heads after categories and ticket code

Revision ID: 01e65dbcdf85
Revises: c9151f2a9c30, add_ticket_code
Create Date: 2025-08-29 16:59:10.169419

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01e65dbcdf85'
down_revision: Union[str, None] = ('c9151f2a9c30', 'add_ticket_code')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
