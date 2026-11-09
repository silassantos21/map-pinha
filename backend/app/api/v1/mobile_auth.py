import uuid

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_or_create_user
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import MobileAuthResponse, MobileGoogleAuthRequest, UserRead

# Fase 10 (app nativo) — ao contrário de todo o resto da API, este router não
# tem `Depends(verify_internal_secret)`: é o único jeito de um app mobile (que
# não pode guardar o segredo interno com segurança, ficaria embutido no
# binário) chegar a um usuário autenticado. A proteção aqui é a verificação
# do ID token do Google, não o segredo compartilhado — ver `_verify_google_id_token`.
router = APIRouter()

_GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def _verify_google_id_token(id_token: str) -> dict:
    """Verifica o ID token contra o endpoint `tokeninfo` do Google — escolha
    pragmática: validar a assinatura localmente contra as chaves públicas do
    Google exigiria a lib `google-auth`, peso extra sem necessidade
    comprovada ainda (mesma filosofia de evitar dependência nova sem
    necessidade já aplicada no resto do backend, ex: sem Celery/WebSocket)."""
    try:
        response = httpx.get(_GOOGLE_TOKENINFO_URL, params={"id_token": id_token}, timeout=10.0)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not reach Google"
        )

    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google ID token")

    claims = response.json()
    if claims.get("aud") != settings.google_mobile_client_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not issued for this app")
    if claims.get("email_verified") not in ("true", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email not verified")

    return claims


def get_current_mobile_user_id(authorization: str = Header(default="")) -> uuid.UUID:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return decode_access_token(authorization.removeprefix("Bearer ").strip())


@router.post("/mobile/auth/google", response_model=MobileAuthResponse)
def mobile_google_login(payload: MobileGoogleAuthRequest, db: Session = Depends(get_db)):
    claims = _verify_google_id_token(payload.id_token)
    user = get_or_create_user(
        db,
        email=claims["email"],
        name=claims.get("name"),
        avatar_url=claims.get("picture"),
        google_id=claims["sub"],
    )
    return MobileAuthResponse(access_token=create_access_token(user.id), user=UserRead.model_validate(user))


@router.get("/mobile/auth/me", response_model=UserRead)
def mobile_me(
    user_id: uuid.UUID = Depends(get_current_mobile_user_id), db: Session = Depends(get_db)
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
