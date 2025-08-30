"""
Add categories table and movie_categories association table

Revision ID: c9151f2a9c30
Revises: e6f7a8b9c0d1
Create Date: 2025-08-29
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c9151f2a9c30'
down_revision = 'e6f7a8b9c0d1'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False, unique=True, index=True),
    )
    op.create_table(
        'movie_categories',
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table('movie_categories')
    op.drop_table('categories')
