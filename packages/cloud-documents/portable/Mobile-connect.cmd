@echo off
setlocal
cd /d "%~dp0"
"runtime\node.exe" "packages\cloud-documents\scripts\mobile-connect.mjs"
pause
