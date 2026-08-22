@echo off
rem Add src directory to PYTHONPATH for test imports
set "PYTHONPATH=%~dp0src"
rem Activate virtual environment
call .venv-codex\Scripts\activate.bat

rem Run pytest with any arguments passed to this script
pytest %*
