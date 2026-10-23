@echo off
setlocal
cd /d "%~dp0"
if not exist ".env.cloud.local" (
  echo Run Start.cmd first to create private connection settings.
  pause
  exit /b 1
)
start "" notepad.exe ".env.cloud.local"
