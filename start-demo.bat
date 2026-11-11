@echo off
cd /d "%~dp0"
start "KOKORO Local Server" /min cmd /c "node server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173"
echo KOKORO is opening in your browser. Keep the minimized server window running while using the site.
pause
