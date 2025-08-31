"""
Add slides table

Revision ID: add_slides_table
Revises: ed49d46b2c5a
Create Date: 2025-08-30 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_slides_table'
down_revision = 'ed49d46b2c5a'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'slides',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('image', sa.String(), nullable=False),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id'), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('slides')
