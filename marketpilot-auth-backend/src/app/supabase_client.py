import httpx
from supabase import Client, create_client

from app.config import get_settings


def get_anon_client() -> Client:
    settings = get_settings()
    client = create_client(str(settings.supabase_url), settings.supabase_anon_key)
    try:
        client.auth._http_client.timeout = httpx.Timeout(30.0, connect=10.0)
    except Exception:
        pass
    return client


def get_service_client() -> Client:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for this operation.")
    client = create_client(str(settings.supabase_url), settings.supabase_service_role_key)
    try:
        client.auth._http_client.timeout = httpx.Timeout(30.0, connect=10.0)
    except Exception:
        pass
    return client

