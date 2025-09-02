"""normalize image urls to relative paths

Revision ID: a210a4fccc1a
Revises: merge_reviews_2fa
Create Date: 2025-09-02 15:25:21.081665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from urllib.parse import urlparse


# revision identifiers, used by Alembic.
revision: str = 'a210a4fccc1a'
down_revision: Union[str, None] = 'merge_reviews_2fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize(val: str | None) -> str | None:
    if not val:
        return val
    s = str(val).strip()
    # keep data URLs and already-correct /api/static paths
    if s.startswith('data:'):
        return s
    if s.startswith('/api/static/'):
        return s
    # legacy without /api prefix
    if s.startswith('/static/'):
        return '/api' + s
    # absolute URL -> parse and extract path
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
            # not a known static path -> leave unchanged (e.g., YouTube trailers)
            return s
        except Exception:
            return s
    return s


def upgrade() -> None:
    conn = op.get_bind()
    # Movies: image, big_image
    try:
        rows = conn.execute(sa.text(
            """
            SELECT id, image, big_image
            FROM movies
            WHERE (image LIKE 'http%' OR image LIKE '/static/%' OR image LIKE '/api/static/%')
               OR (big_image LIKE 'http%' OR big_image LIKE '/static/%' OR big_image LIKE '/api/static/%')
            """
        )).mappings().all()
        for r in rows:
            new_image = _normalize(r['image'])
            new_big = _normalize(r['big_image'])
            if new_image != r['image'] or new_big != r['big_image']:
                conn.execute(
                    sa.text("UPDATE movies SET image = :img, big_image = :big WHERE id = :id"),
                    { 'img': new_image, 'big': new_big, 'id': r['id'] }
                )
    except Exception:
        pass

    # News: image
    try:
        rows = conn.execute(sa.text(
            """
            SELECT id, image
            FROM news
            WHERE image LIKE 'http%' OR image LIKE '/static/%' OR image LIKE '/api/static/%'
            """
        )).mappings().all()
        for r in rows:
            new_image = _normalize(r['image'])
            if new_image != r['image']:
                conn.execute(
                    sa.text("UPDATE news SET image = :img WHERE id = :id"),
                    { 'img': new_image, 'id': r['id'] }
                )
    except Exception:
        pass


def downgrade() -> None:
    # Irreversible data migration
    pass
