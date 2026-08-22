from supabase import Client, create_client

from app.config import get_settings


def get_anon_client() -> Client:
    settings = get_settings()
    return create_client(str(settings.supabase_url), settings.supabase_anon_key)


def get_service_client() -> Client:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for this operation.")
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)

