@echo off
chcp 65001 >nul
title Minecraft Learning - Build Tool

echo.
echo  ===========================================================
echo          Minecraft Learning - Markdown Build Tool
echo  ===========================================================
echo.
echo   UI/theme: edit styles.css (tutorial pages use --bg-* vars)
echo   After CSS-only changes you can skip this and refresh browser
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Node.js not found. Please install: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo   [OK] Node.js is ready

echo.
echo [2/3] Converting Markdown to HTML (includes module index pages^)...
node scripts\converter.js all
if errorlevel 1 (
    echo.
    echo   [ERROR] Conversion failed
    pause
    exit /b 1
)
echo   [OK] Conversion done

echo.
echo [3/3] Scanning docs and generating stats...
node scan-docs.js
if errorlevel 1 (
    echo.
    echo   [ERROR] Scan failed
    pause
    exit /b 1
)
echo   [OK] Scan done

echo.
echo  ===========================================================
echo                    Build Complete!
echo  ===========================================================
echo.
echo   HTML files are in docs/
echo.
echo   Tip: Run preview.bat to start local server
echo   (http://localhost:3000)
echo.
pause
