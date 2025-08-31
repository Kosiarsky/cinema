"""
Add reviews table for movie ratings

Revision ID: add_reviews_table
Revises: add_news_table
Create Date: 2025-08-31 12:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_reviews_table'
down_revision = 'add_news_table'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id'), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.String(), nullable=True),
        sa.Column('is_anonymous', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    # optional: unique review per (user_id, movie_id)
    op.create_unique_constraint('uq_reviews_user_movie', 'reviews', ['user_id', 'movie_id'])


def downgrade() -> None:
    op.drop_constraint('uq_reviews_user_movie', 'reviews', type_='unique')
    op.drop_table('reviews')
