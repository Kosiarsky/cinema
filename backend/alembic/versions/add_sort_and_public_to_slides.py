"""
Add sort_order and is_public to slides

Revision ID: add_sort_and_public_to_slides
Revises: add_slides_table
Create Date: 2025-08-31 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_sort_and_public_to_slides'
down_revision = 'add_slides_table'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('slides', sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('slides', sa.Column('is_public', sa.Integer(), nullable=False, server_default='1'))
    # Remove server_default after setting initial values
    op.alter_column('slides', 'sort_order', server_default=None)
    op.alter_column('slides', 'is_public', server_default=None)


def downgrade() -> None:
    op.drop_column('slides', 'is_public')
    op.drop_column('slides', 'sort_order')
