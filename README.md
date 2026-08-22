# 🚀 MarketPilot AI — Autonomous Marketing Intelligence & Campaign Engine

MarketPilot AI is a production-grade autonomous marketing strategist and content generation platform designed for e-commerce brands, marketing teams, and small businesses.

---

## 🌟 Key Capabilities

1. **🧠 AI Strategy Engine**: Formulates 4-pillar campaigns (Hero Awareness, Direct Response Acquisition, Trend Velocity, VIP Retention) grounded in real-world product profit margins.
2. **📈 Real-Time Trend Intelligence**: Ingests and scores viral trend signals with verified source URLs and freshness timestamps.
3. **💰 Margin-Aware Product Prioritization**: Automatically calculates profit margins (Retail vs Cost) and selects high-margin items for maximum ROAS.
4. **✍️ Content Studio (5 Formats)**: Generates social post captions, 5-slide carousels, timed video scripts with camera directions, email newsletters, and WhatsApp broadcasts.
5. **📅 Smart Editorial Calendar**: Schedules and balances organic and paid content across 7-day or 30-day timelines with 1-click batch generation.
6. **🛡️ Inviolable Brand Kit & Guardrails**: Enforces brand voice rules, blocks prohibited phrases with regex + LLM safety checks, and prevents product hallucinations.
7. **📦 Multi-Format Export Center**: Downloads production-ready assets in Markdown briefs, CSV copywriter spreadsheets, print-ready HTML/PDF reports, and full JSON workspace backups.
8. **🌐 Public & Dashboard Multi-Experience**: Complete public website with landing page, features, pricing, and how-it-works views alongside the protected dashboard.

---

## 🏗️ Architecture & Tech Stack

```
Internship Project/
├── marketpilot-auth-backend/    # FastAPI + Pydantic v2 + Supabase (109 Tests)
│   ├── src/app/
│   │   ├── routers/            # Auth, Products, Brand Kit, Trends, Strategy, Reporting
│   │   ├── services/           # StrategyEngine, LLMOrchestrator, Guardrails, Exporter
│   │   └── schemas.py          # Strict Pydantic v2 validation models
│   └── tests/                  # Pytest test suite (109 passing tests)
│
├── marketpilot-frontend/        # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/         # Navbar, Footer, Sidebar, Header, Modals
│   │   ├── pages/public/       # Landing, Features, Pricing, HowItWorks, Login, Signup
│   │   ├── pages/              # Overview, Planner, Studio, Calendar, Products, BrandKit
│   │   └── context/            # AuthContext (JWT + Session persistence)
│
└── start_project.bat            # 1-Click dual-server launcher
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Quick Start (Single Command)
Double-click `start_project.bat` in the root folder or run:
```bash
.\start_project.bat
```

### Manual Setup

#### 1. Backend Setup
```bash
cd marketpilot-auth-backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --app-dir src --reload --port 8000
```
API Documentation: `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup
```bash
cd marketpilot-frontend
npm install
npm run dev -- --port 3000
```
Frontend UI: `http://localhost:3000`

---

## 🧪 Testing

Run backend automated test suite:
```bash
cd marketpilot-auth-backend
pytest
```
*109 passing tests covering all 9 modules.*

---

## 📄 License
MIT License
