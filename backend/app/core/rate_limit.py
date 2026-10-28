import uuid

from fastapi import HTTPException, status

from app.core.cache import increment_with_ttl

ONE_DAY_SECONDS = 86400


def enforce_ai_rate_limit(user_id: uuid.UUID, bucket: str, limit: int) -> None:
    """Limite diário por usuário e por agente, pra controlar custo da API da
    Claude (Sprint 5). Resiliente: se o Redis estiver fora do ar, não bloqueia
    o usuário — mesma filosofia do cache de rotas."""
    count = increment_with_ttl(f"ai_rate:{bucket}:{user_id}", ONE_DAY_SECONDS)
    if count is not None and count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Limite diário de uso da IA atingido. Tente novamente mais tarde.",
        )
