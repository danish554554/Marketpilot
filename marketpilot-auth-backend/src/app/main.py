from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, auth, brand_kit, budget, offers, orchestration, planner, products, profile, reporting, strategy, trends, workspaces

settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.9.0",
    description="MarketPilot AI (Version 1) — Complete text-first marketing suite: auth, workspace, Brand Kit, product catalogue/offers/budget, Trend Intelligence, LLM Orchestration & Guardrails, Strategy Engine, Planner/Editorial Calendar, and Export/Reporting/Audit.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(profile.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(workspaces.router, prefix=settings.api_v1_prefix)
app.include_router(brand_kit.router, prefix=settings.api_v1_prefix)
app.include_router(products.router, prefix=settings.api_v1_prefix)
app.include_router(offers.router, prefix=settings.api_v1_prefix)
app.include_router(budget.router, prefix=settings.api_v1_prefix)
app.include_router(trends.router, prefix=settings.api_v1_prefix)
app.include_router(orchestration.router, prefix=settings.api_v1_prefix)
app.include_router(strategy.router, prefix=settings.api_v1_prefix)
app.include_router(planner.router, prefix=settings.api_v1_prefix)
app.include_router(reporting.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}

