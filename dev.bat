@echo off
chcp 65001 >nul
title Minecraft Learning - Dev Workflow

echo.
echo  ===========================================================
echo          Minecraft Learning - Dev Workflow
echo  ===========================================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Node.js not found. Please install: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo   [OK] Node.js is ready

echo.
echo [2/5] Cleaning old build files...
echo   Press Y to clean docs/, or N to skip...
choice /c YN /m "   Clean docs/ directory"
if errorlevel 1 (
    if exist docs (
        echo   Cleaning docs/...
        rd /s /q docs 2>nul
        mkdir docs
    )
) else (
    echo   Skipping cleanup
)

echo.
echo [3/5] Converting Markdown to HTML...
node scripts\converter.js all
if errorlevel 1 (
    echo.
    echo   [ERROR] Conversion failed
    pause
    exit /b 1
)
echo   [OK] Conversion done

echo.
echo [4/5] Generating index pages...
node scripts\converter.js index
echo   [OK] Index pages generated

echo.
echo [5/5] Scanning docs and generating stats...
node scan-docs.js
echo   [OK] Scan done

echo.
echo  ===========================================================
echo                    Build Complete!
echo  ===========================================================
echo.
echo   Choose an action:
echo.
echo   [1] Start preview server (http://localhost:3000)
echo   [2] Open docs/index.html in browser
echo   [3] Exit
echo.
choice /c 123 /n /m "   Enter option (1/2/3): "

if errorlevel 3 exit /b 0
if errorlevel 2 (
    echo.
    echo   Opening browser...
    start "" "docs\index.html"
    exit /b 0
)
if errorlevel 1 (
    echo.
    echo   Starting preview server...
    echo   URL: http://localhost:3000
    echo   Press Ctrl+C to stop the server
    echo.
    node server.js
)
