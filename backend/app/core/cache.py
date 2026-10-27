import redis

from app.core.config import settings

# Cliente único e preguiçoso (reaproveitado entre requests) — cache é um
# bônus de performance, nunca pode derrubar a aplicação se o Redis cair.
_client: redis.Redis | None = None


def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, socket_timeout=1.0, socket_connect_timeout=1.0)
    return _client


def cache_get(key: str) -> str | None:
    try:
        value = _get_client().get(key)
        return value.decode("utf-8") if value is not None else None
    except redis.RedisError:
        return None


def cache_set(key: str, value: str, ttl_seconds: int) -> None:
    try:
        _get_client().setex(key, ttl_seconds, value)
    except redis.RedisError:
        pass
