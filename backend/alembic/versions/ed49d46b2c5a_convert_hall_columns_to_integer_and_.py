"""convert hall columns to integer and strip Sala prefix

Revision ID: ed49d46b2c5a
Revises: 01e65dbcdf85
Create Date: 2025-08-31 01:17:35.626535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed49d46b2c5a'
down_revision: Union[str, None] = '01e65dbcdf85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == 'postgresql':
        op.alter_column(
            'schedules',
            'hall',
            existing_type=sa.String(),
            type_=sa.Integer(),
            postgresql_using=(
                "NULLIF(REGEXP_REPLACE(hall, '^[Ss]ala\\s*', '', 'g'), '')::integer"
            ),
            existing_nullable=True,
        )
        op.alter_column(
            'tickets',
            'hall',
            existing_type=sa.String(),
            type_=sa.Integer(),
            postgresql_using=(
                "NULLIF(REGEXP_REPLACE(hall, '^[Ss]ala\\s*', '', 'g'), '')::integer"
            ),
            existing_nullable=True,
        )
    else:
        op.execute("UPDATE schedules SET hall = TRIM(REPLACE(REPLACE(hall, 'Sala ', ''), 'sala ', '')) WHERE hall IS NOT NULL")
        op.execute("UPDATE tickets   SET hall = TRIM(REPLACE(REPLACE(hall, 'Sala ', ''), 'sala ', '')) WHERE hall IS NOT NULL")
        op.alter_column('schedules', 'hall', existing_type=sa.String(), type_=sa.Integer(), existing_nullable=True)
        op.alter_column('tickets', 'hall', existing_type=sa.String(), type_=sa.Integer(), existing_nullable=True)


def downgrade() -> None:
    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == 'postgresql':
        op.alter_column(
            'schedules',
            'hall',
            existing_type=sa.Integer(),
            type_=sa.String(),
            postgresql_using=(
                "CASE WHEN hall IS NULL THEN NULL ELSE 'Sala ' || hall::text END"
            ),
            existing_nullable=True,
        )
        op.alter_column(
            'tickets',
            'hall',
            existing_type=sa.Integer(),
            type_=sa.String(),
            postgresql_using=(
                "CASE WHEN hall IS NULL THEN NULL ELSE 'Sala ' || hall::text END"
            ),
            existing_nullable=True,
        )
    else:
        op.alter_column('schedules', 'hall', existing_type=sa.Integer(), type_=sa.String(), existing_nullable=True)
        op.alter_column('tickets', 'hall', existing_type=sa.Integer(), type_=sa.String(), existing_nullable=True)
