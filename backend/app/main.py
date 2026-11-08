import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.comments import router as comments_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.follows import router as follows_router
from app.api.v1.groups import router as groups_router
from app.api.v1.health import router as health_router
from app.api.v1.media import router as media_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.pois import router as pois_router
from app.api.v1.routes import router as routes_router
from app.api.v1.users import router as users_router
from app.core.config import settings

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=1.0,
        send_default_pii=False,
    )

app = FastAPI(title="MaPinha API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(pois_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(favorites_router, prefix="/api/v1")
app.include_router(routes_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
# `follows_router` tem `/users/search` — precisa vir ANTES de `users_router`
# (que tem `/users/{user_id}`), senão "search" seria tratado como um
# `user_id` inválido (422) em vez de casar com a rota de busca. Mesmo
# cuidado de ordem já aplicado em `pois.py` (`/pois/by-slug/{slug}` antes de
# `/pois/{poi_id}`).
app.include_router(follows_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(groups_router, prefix="/api/v1")
app.include_router(comments_router, prefix="/api/v1")
