# MarketPilot AI — Modules 1–8 backend

This FastAPI backend implements Version 1 Modules 1–8: authentication/user management, business workspace, Brand Kit, Product Catalogue (with cost price, profit margins, features, and pain points), Offers/Promotions system, Marketing Budget allocation, Trend Intelligence Engine, LLM Orchestration & Guardrails, Strategy Engine, and the **Planner & Editorial Calendar**.

## Project layout

```text
src/app/
  config.py              Environment configuration
  dependencies.py        Bearer-token authentication and role checks
  supabase_client.py     Supabase clients (anonymous and server-only service role)
  schemas.py             Request/response validation models
  services/              Context builder, guardrails engine, LLM orchestrator, strategy engine, and planner service
  routers/               Auth, profile, admin, workspace, Brand Kit, product, offer, budget, trend, orchestration, strategy, and planner endpoints
  main.py                Application entry point
supabase/schema.sql      Module 1 profiles table, trigger, and RLS
supabase/migrations/     Module-specific database migrations (002–010)
tests/                   Schema, CSV import, offer, budget, trend, guardrails, orchestration, strategy, and planner tests
```

## Supabase setup (run in order)

1. Create a new project at [Supabase](https://supabase.com/dashboard). Save its project URL.
2. In **Authentication → Providers → Email**, enable Email. For easy local development, optionally turn off **Confirm email**; otherwise registration returns a confirmation-required response with no session.
3. In **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/reset-password` to **Redirect URLs**.
4. Open **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql) (Module 1: profiles table, trigger, and RLS).
5. Run [`supabase/migrations/002_business_workspaces.sql`](supabase/migrations/002_business_workspaces.sql) (Module 2: business workspace).
6. Run [`supabase/migrations/003_brand_kit.sql`](supabase/migrations/003_brand_kit.sql) (Module 3: Brand Kit).
7. Run [`supabase/migrations/004_product_catalogue.sql`](supabase/migrations/004_product_catalogue.sql) (Module 4: product catalogue).
8. Run [`supabase/migrations/004b_product_margins.sql`](supabase/migrations/004b_product_margins.sql) (Module 4: product cost price, features, and pain points).
9. Run [`supabase/migrations/005_offers.sql`](supabase/migrations/005_offers.sql) (Module 4: offers and promotions).
10. Run [`supabase/migrations/006_marketing_budget.sql`](supabase/migrations/006_marketing_budget.sql) (Module 4: marketing budget).
11. Run [`supabase/migrations/007_trend_intelligence.sql`](supabase/migrations/007_trend_intelligence.sql) (Module 5: trend signals).
12. Run [`supabase/migrations/008_llm_orchestration_guardrails.sql`](supabase/migrations/008_llm_orchestration_guardrails.sql) (Module 6: AI generation audit logs and guardrail tracking).
13. Run [`supabase/migrations/009_strategy_engine.sql`](supabase/migrations/009_strategy_engine.sql) (Module 7: marketing strategies and campaign pillars).
14. Run [`supabase/migrations/010_planner_editorial_calendar.sql`](supabase/migrations/010_planner_editorial_calendar.sql) (Module 8: planner content items and editorial calendar).
15. In **Project Settings → API**, copy the **Project URL**, the `anon` key, and the `service_role` secret.
16. Register your first account through `/api/v1/auth/register`. Then run the final commented `update` command in `schema.sql` with your email to make that account an `administrator`.

## Local run

Requires Python 3.11+.

1. Copy `.env.example` to `.env` and fill in Supabase credentials.
2. Create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install dependencies and start the API:

   ```powershell
   pip install -r requirements.txt
   uvicorn app.main:app --app-dir src --reload
   ```
   Or use the shortcut script:
   ```powershell
   .\run_dev.bat
   ```

4. Open `http://127.0.0.1:8000/docs` to view the interactive OpenAPI documentation. Check `http://127.0.0.1:8000/health` first.

5. To run the validation tests:

   ```powershell
   pytest
   ```
   Or run the batch helper:
   ```powershell
   .\run_tests.bat
   ```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create a business-owner account |
| POST | `/api/v1/auth/login` | Return an access token and refresh token |
| POST | `/api/v1/auth/password-reset` | Send a reset email (non-enumerating response) |
| PUT | `/api/v1/auth/password` | Change password with a valid Bearer token |
| POST | `/api/v1/auth/logout` | Revoke the supplied access/refresh-token session |
| DELETE | `/api/v1/auth/account` | Permanently delete the current identity and profile |
| GET/PATCH | `/api/v1/profile` | View or update the current profile |
| GET | `/api/v1/admin/users` | Administrator-only user list |
| PATCH | `/api/v1/admin/users/{id}/role` | Administrator-only role assignment |
| POST | `/api/v1/workspaces` | Create the current owner’s single business workspace |
| GET/PATCH | `/api/v1/workspaces/me` | View or update the current owner’s workspace |
| GET | `/api/v1/workspaces/{id}` | View a workspace (owner or administrator only) |
| GET | `/api/v1/workspaces` | List all workspaces (administrator only) |
| POST | `/api/v1/brand-kit` | Create the current workspace's Brand Kit |
| GET/PATCH | `/api/v1/brand-kit/me` | View or update the current workspace's Brand Kit |
| POST | `/api/v1/products` | Create a product for the current workspace |
| GET | `/api/v1/products` | List products; optionally filter by `status`, `priority`, or `category` |
| GET | `/api/v1/products/available` | Planner-ready products (active + in-stock + enriched with offers and margin tiers) |
| GET/PATCH/DELETE | `/api/v1/products/{id}` | View, update, or permanently remove a product |
| GET | `/api/v1/products/import/template` | Download the CSV product-import template |
| POST | `/api/v1/products/import/csv` | Validate and import a CSV product catalogue |
| POST | `/api/v1/offers` | Create an offer/promotion for the workspace or a specific product |
| GET | `/api/v1/offers` | List offers; filter by `status` or `product_id` |
| GET | `/api/v1/offers/active` | List currently active, date-valid offers |
| GET/PATCH/DELETE | `/api/v1/offers/{id}` | View, update, or delete an offer |
| POST | `/api/v1/budget` | Set the workspace's monthly marketing budget and organic/paid split |
| GET/PATCH | `/api/v1/budget/me` | View or update the marketing budget allocation |
| GET | `/api/v1/trends` | Search verified trend signals with platform, category, confidence, and freshness filters |
| GET | `/api/v1/trends/match` | Automatically retrieve trends tailored to the caller's workspace industry and market |
| GET | `/api/v1/trends/{id}` | View details of a specific trend signal |
| POST | `/api/v1/trends` | Administrator-only: Ingest a verified trend signal with grounded source evidence |
| PATCH/DELETE | `/api/v1/trends/{id}` | Administrator-only: Update or delete a trend signal |
| GET | `/api/v1/orchestration/context` | Inspect compiled structured business intelligence context for LLM prompt |
| POST | `/api/v1/orchestration/generate` | Generate strategic recommendations with grounded context, guardrail checks & audit logs |
| POST | `/api/v1/orchestration/validate` | Standalone guardrail evaluation of arbitrary marketing text against Brand Kit and products |
| GET | `/api/v1/orchestration/logs` | View AI generation and guardrail validation audit logs |
| GET | `/api/v1/orchestration/logs/{id}` | View details of a specific AI generation audit log |
| POST | `/api/v1/strategy/generate` | Generate end-to-end multi-channel marketing strategy with campaign pillars |
| POST | `/api/v1/strategy` | Manually create a marketing strategy with custom pillars |
| GET | `/api/v1/strategy` | List marketing strategies for the workspace (filter by status or timeframe) |
| GET | `/api/v1/strategy/active` | Retrieve the workspace's currently active marketing strategy |
| GET/PATCH/DELETE | `/api/v1/strategy/{id}` | View, update (e.g. approve/activate), or delete a marketing strategy |
| POST | `/api/v1/strategy/{id}/pillars` | Add a campaign pillar to a strategy |
| PATCH/DELETE | `/api/v1/strategy/{id}/pillars/{pillar_id}` | Edit or delete a specific campaign pillar |
| POST | `/api/v1/planner/generate-batch` | Batch generate scheduled editorial calendar and copywriting package |
| GET | `/api/v1/planner/calendar` | Retrieve calendar view within a start and end date range |
| POST | `/api/v1/planner/items` | Manually create and schedule a content item |
| GET | `/api/v1/planner/items` | List scheduled content items (filter by channel, format, status, strategy, pillar) |
| GET/PATCH/DELETE | `/api/v1/planner/items/{id}` | View, update copy/status, or delete a scheduled content item |
| GET | `/api/v1/export/strategy/{id}` | Export marketing strategy in Markdown, CSV, HTML (print/PDF), or JSON |
| GET | `/api/v1/export/calendar` | Export editorial calendar / copywriter handoff sheet in CSV, Markdown, HTML, or JSON |
| GET | `/api/v1/export/workspace-backup` | Download complete structured JSON backup of all workspace intelligence |
| GET | `/api/v1/reporting/workspace-health` | Real-time Marketing Intelligence Readiness and Health score (0–100%) |
| GET | `/api/v1/reporting/ai-compliance` | Aggregated AI guardrail safety, pass rates, and latency compliance audit |

For protected routes, set `Authorization: Bearer <access_token>`.

## Module 8: Planner, Editorial Calendar & Content Batch Generation

The Planner turns strategy campaign pillars into scheduled, production-ready copywriting:
* **Batch Editorial Calendar (`POST /api/v1/planner/generate-batch`)**: Distributes content items across calendar dates with balanced channel cadence and organic/paid balance.
* **Multi-Format Copywriting Engine**:
  - **Social Captions**: Hooks, bullet-point feature breakdowns, hashtags, approved Brand Kit CTAs.
  - **5-Slide Carousels**: Structured slide decks (Hook, Problem Breakdown, Solution, Results, Save & Share CTA).
  - **Short-Form Video Scripts**: Timed scenes with visual direction notes, spoken audio narration, and on-screen text overlays.
  - **Email Newsletters**: High-converting subject line variations, preview text, structured body storytelling, and CTA buttons.
  - **WhatsApp / SMS Broadcasts**: Conversational direct messages with offer highlights and reply CTAs.
* **Calendar Date-Range View (`GET /api/v1/planner/calendar`)**: View items across custom date windows with status filtering.

## Module 9: Export, Reporting & Audit System

The Export and Reporting engine provides data portability, human handoff workflows, and compliance auditing:
* **Multi-Format Strategy & Calendar Exports**: Download executive briefs (Markdown), spreadsheets for copywriters/managers (CSV), print-styled HTML reports, or raw JSON.
* **Workspace Intelligence Health Score (`GET /api/v1/reporting/workspace-health`)**: Evaluates 8 core dimensions (onboarding, brand voice, profit margins, active offers, budget split, trends, strategy, calendar) with weighted scoring (0–100%) and actionable advice.
* **AI Safety & Compliance Audit (`GET /api/v1/reporting/ai-compliance`)**: Aggregates guardrail pass rates, prohibited word sanitization metrics, and execution latency.
* **Full Workspace Portability (`GET /api/v1/export/workspace-backup`)**: Single-click complete JSON backup of the workspace.




