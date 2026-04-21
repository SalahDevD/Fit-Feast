@echo off
setlocal enabledelayedexpansion

REM Get the backend directory
for %%I in ("%~dp0.") do set BACKEND_DIR=%%~fI

REM Set Python path
set PYTHON=C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe

REM Set environment variables
set PYTHONDONTWRITEBYTECODE=1
set DJANGO_SETTINGS_MODULE=fitfeast_backend.settings

echo.
echo ================================================
echo     FitFeast Django Backend Server
echo ================================================
echo.
echo Backend Directory: %BACKEND_DIR%
echo Python: %PYTHON%
echo.

REM Change to the backend directory
cd /d "%BACKEND_DIR%\fitfeast_backend"

REM Verify manage.py exists
if not exist manage.py (
    echo ERROR: manage.py not found!
    echo Current directory: %cd%
    pause
    exit /b 1
)

echo Running database migrations...
"%PYTHON%" manage.py migrate --run-syncdb

echo.
echo Starting Django development server...
echo Backend URL: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

"%PYTHON%" manage.py runserver 0.0.0.0:8000

pause
