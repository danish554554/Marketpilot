@echo off
set "PYTHONPATH=%~dp0src"
call .venv-codex\Scripts\activate.bat
uvicorn app.main:app --app-dir src --reload --port 8000
