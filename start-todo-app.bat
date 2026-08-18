@echo off
title To-do app  --  close this window to stop it
cd /d "%~dp0"

echo Starting the to-do app...

REM Give the server a couple of seconds to wake up, then open the browser.
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4321"

node server.js

echo.
echo The to-do app has stopped.
pause
