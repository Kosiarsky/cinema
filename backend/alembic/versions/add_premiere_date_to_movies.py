from alembic import op
import sqlalchemy as sa

"""
Add premiere_date to movies

Revision ID: add_premiere_date_to_movies
Revises: add_sort_and_public_to_slides
Create Date: 2025-08-31 00:10:00.000000
"""

# revision identifiers, used by Alembic.
revision = 'add_premiere_date_to_movies'
down_revision = 'add_sort_and_public_to_slides'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('movies') as batch_op:
        batch_op.add_column(sa.Column('premiere_date', sa.Date(), nullable=True))


def downgrade():
    with op.batch_alter_table('movies') as batch_op:
        batch_op.drop_column('premiere_date')