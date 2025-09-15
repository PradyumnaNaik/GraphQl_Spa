@echo off
set PORT=4001
uvicorn app.main:app --reload --port %PORT%
