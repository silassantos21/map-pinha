from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.health import router as health_router
from app.api.v1.media import router as media_router
from app.api.v1.pois import router as pois_router
from app.api.v1.routes import router as routes_router
from app.core.config import settings

app = FastAPI(title="MapPin API", version="0.1.0")

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
