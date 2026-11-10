import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Header, HTTPException, status

from app.core.config import settings

# Fase 10 (app nativo) — token próprio do app mobile, emitido por
# `POST /mobile/auth/google` depois de validar o login Google no dispositivo.
# Sem refresh token nesta primeira versão: 30 dias de validade, expira e o
# usuário loga de novo com o Google — a mesma filosofia de evitar
# complexidade nova sem necessidade comprovada já aplicada no projeto pra
# Celery/WebSocket (ver SPRINTS.md).
_ALGORITHM = "HS256"
_EXPIRES_IN = timedelta(days=30)


def create_access_token(user_id: uuid.UUID) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + _EXPIRES_IN,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    try:
        return uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")


def require_internal_secret_or_mobile_user(
    x_internal_secret: str = Header(default=""),
    authorization: str = Header(default=""),
) -> uuid.UUID | None:
    """Autenticação dupla (Fase 10 Parte 2) pra endpoints chamados tanto pelo
    BFF do Next.js (segredo interno, `user_id` confiado via query/body — ver
    `verify_internal_secret` em `app/api/v1/auth.py`) quanto pelo app mobile
    (JWT Bearer, sem acesso ao segredo interno). Devolve o `user_id`
    resolvido do JWT quando presente — o endpoint deve IGNORAR qualquer
    `user_id` vindo de fora e usar este, senão um app mobile autenticado
    poderia pedir o `user_id` de outra pessoa via query. Devolve `None`
    quando a chamada veio do BFF (comportamento de sempre: endpoint confia no
    `user_id` que já recebe)."""
    if authorization.startswith("Bearer "):
        return decode_access_token(authorization.removeprefix("Bearer ").strip())

    if settings.internal_api_secret and x_internal_secret == settings.internal_api_secret:
        return None

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
