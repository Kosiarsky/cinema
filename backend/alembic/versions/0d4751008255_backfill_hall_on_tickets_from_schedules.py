"""backfill hall on tickets from schedules

Revision ID: 0d4751008255
Revises: f102402de6a1
Create Date: 2025-08-24 16:45:45.222677

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = '0d4751008255'
down_revision: Union[str, None] = 'f102402de6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure tickets.hall exists (it should, but safe-guard)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('tickets')]
    if 'hall' not in cols:
        op.add_column('tickets', sa.Column('hall', sa.String(), nullable=True))

    # Backfill tickets.hall from schedules.hall where missing
    conn.execute(text(
        """
        UPDATE tickets t
        SET hall = s.hall
        FROM schedules s
        WHERE t.schedule_id = s.id AND (t.hall IS NULL OR t.hall = '')
        """
    ))


def downgrade() -> None:
    # No-op: we won't revert data backfill
    pass
