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


def increment_with_ttl(key: str, ttl_seconds: int) -> int | None:
    """Incrementa um contador, iniciando o TTL só na primeira vez (janela
    deslizante simples) — usado pelo rate limiting dos agentes de IA.
    Retorna `None` se o Redis estiver fora do ar, pra chamador decidir o que
    fazer (aqui: nunca bloquear o usuário por causa do cache)."""
    try:
        client = _get_client()
        count = client.incr(key)
        if count == 1:
            client.expire(key, ttl_seconds)
        return count
    except redis.RedisError:
        return None
