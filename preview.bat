@echo off
chcp 65001 >nul
title Minecraft Learning - Preview Server

echo.
echo  ===========================================================
echo          Minecraft Learning - Local Preview Server
echo  ===========================================================
echo.

cd /d "%~dp0"

echo Starting preview server...
echo URL: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
