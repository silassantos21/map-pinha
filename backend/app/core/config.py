from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://mappin:mappin@localhost:5433/mappin"
    redis_url: str = "redis://localhost:6379/0"
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
