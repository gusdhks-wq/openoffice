@echo off
setlocal
cd /d "%~dp0"
if not exist "runtime\node.exe" (
  echo Extract the entire ZIP first, then run Start.cmd again.
  pause
  exit /b 1
)
"runtime\node.exe" "packages\cloud-documents\scripts\local.mjs" --open
pause
