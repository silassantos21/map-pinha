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

    # Sentry (rastreamento de erros) — sentry.io > projeto backend > Settings > Client Keys (DSN)
    sentry_dsn: str = ""

    # Fase 10 (app nativo) — autenticação mobile própria (JWT), separada da
    # sessão NextAuth do frontend web. `jwt_secret` assina/valida os tokens
    # emitidos por `POST /mobile/auth/google`; `google_mobile_client_id` é o
    # client ID OAuth do app nativo no Google Cloud (diferente do client ID
    # web usado pelo NextAuth) — valida o campo `aud` do ID token recebido,
    # pra garantir que o token veio de login no nosso app, não de outro.
    jwt_secret: str = ""
    google_mobile_client_id: str = ""


settings = Settings()
