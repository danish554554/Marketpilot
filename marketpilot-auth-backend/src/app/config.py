from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "MarketPilot AI API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    supabase_url: AnyHttpUrl
    supabase_anon_key: str = Field(min_length=20)
    supabase_service_role_key: str | None = None
    password_reset_redirect_url: AnyHttpUrl

    # Google Gemini AI Provider Configuration
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.6-flash"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

