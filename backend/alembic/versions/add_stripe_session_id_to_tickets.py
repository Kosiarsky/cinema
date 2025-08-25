"""add stripe_session_id to tickets and unique index

Revision ID: add_stripe_session_id
Revises: f102402de6a1
Create Date: 2025-08-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_stripe_session_id'
down_revision = 'f102402de6a1'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tickets', sa.Column('stripe_session_id', sa.String(), nullable=True))
    op.create_unique_constraint('uq_tickets_stripe_session_id', 'tickets', ['stripe_session_id'])


def downgrade():
    op.drop_constraint('uq_tickets_stripe_session_id', 'tickets', type_='unique')
    op.drop_column('tickets', 'stripe_session_id')
