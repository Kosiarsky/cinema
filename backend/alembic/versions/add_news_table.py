"""
Add news table

Revision ID: add_news_table
Revises: add_premiere_date_to_movies
Create Date: 2025-08-31 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_news_table'
down_revision = 'add_premiere_date_to_movies'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'news',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('image', sa.String(), nullable=True),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id'), nullable=True),
        sa.Column('is_public', sa.Integer(), nullable=False, server_default='1'),
    )
    op.alter_column('news', 'is_public', server_default=None)


def downgrade() -> None:
    op.drop_table('news')
