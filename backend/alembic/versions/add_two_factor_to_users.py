from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_two_factor_to_users'
down_revision = 'b1a2c3d4e5f6'  # latest head from fix_sequences_for_tickets_and_ticket_seats
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('two_factor_enabled', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('two_factor_secret', sa.String(), nullable=True))
    op.execute("UPDATE users SET two_factor_enabled = 0 WHERE two_factor_enabled IS NULL")


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('two_factor_secret')
        batch_op.drop_column('two_factor_enabled')
