import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.poi import POI


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    return slug or "poi"


def slugify_unique(db: Session, name: str) -> str:
    base = _slugify(name)
    slug = base
    suffix = 1
    while db.scalar(select(POI.id).where(POI.slug == slug)) is not None:
        suffix += 1
        slug = f"{base}-{suffix}"
    return slug
