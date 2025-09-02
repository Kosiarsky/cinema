"""normalize slide image urls to relative paths

Revision ID: b81e3395dd24
Revises: a210a4fccc1a
Create Date: 2025-09-02 15:28:56.556946

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from urllib.parse import urlparse


# revision identifiers, used by Alembic.
revision: str = 'b81e3395dd24'
down_revision: Union[str, None] = 'a210a4fccc1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize(val: str | None) -> str | None:
    if not val:
        return val
    s = str(val).strip()
    if s.startswith('data:'):
        return s
    if s.startswith('/api/static/'):
        return s
    if s.startswith('/static/'):
        return '/api' + s
    if s.startswith('http://') or s.startswith('https://'):
        try:
            p = urlparse(s)
            path = p.path or ''
            if not path:
                return s
            if path.startswith('/api/static/'):
                return path
            if path.startswith('/static/'):
                return '/api' + path
            return s
        except Exception:
            return s
    return s


def upgrade() -> None:
    conn = op.get_bind()
    try:
        rows = conn.execute(sa.text(
            """
            SELECT id, image
            FROM slides
            WHERE image LIKE 'http%' OR image LIKE '/static/%' OR image LIKE '/api/static/%'
            """
        )).mappings().all()
        for r in rows:
            new_image = _normalize(r['image'])
            if new_image != r['image']:
                conn.execute(
                    sa.text("UPDATE slides SET image = :img WHERE id = :id"),
                    { 'img': new_image, 'id': r['id'] }
                )
    except Exception:
        pass


def downgrade() -> None:
    # Irreversible data migration
    pass
