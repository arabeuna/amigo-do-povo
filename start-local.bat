@echo off
REM Script para rodar backend e frontend em paralelo no Windows

cd /d %~dp0

REM Iniciar backend
start "Backend" cmd /k "cd backend && npm run dev"

REM Iniciar frontend
start "Frontend" cmd /k "cd frontend && npm start"

REM Mensagem de instrução
ECHO =========================================
ECHO Backend: http://localhost:5000/api
ECHO Frontend: http://localhost:3000
ECHO Use CTRL+C para parar cada janela.
ECHO =========================================
pause 