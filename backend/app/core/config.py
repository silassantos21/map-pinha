from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://mappin:mappin@localhost:5433/mappin"
    redis_url: str = "redis://localhost:6379/0"
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:3000"]

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""

    # Segredo compartilhado com o Next.js: autentica chamadas server-to-server
    # vindas do proxy confiável do Next.js (NextAuth sync, e a partir da Sprint 3
    # todo endpoint de escrita de POI/categoria/mídia) — nunca é exposto ao
    # navegador. Ver SPRINTS.md Sprint 1/3.
    internal_api_secret: str = ""

    # Agentes de IA (Sprint 5) — categorizador, escritor de bio, recomendador.
    anthropic_api_key: str = ""


settings = Settings()
