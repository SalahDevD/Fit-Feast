@echo off
REM FitFeast Backend Startup Script

REM Set Python path
set PYTHON=C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe

REM Navigate to backend directory
cd "C:\Users\salah\OneDrive\Desktop\Fit Feast\backend\fitfeast_backend"

echo ================================================
echo     FitFeast Django Backend Server
echo ================================================
echo.

REM Check if Python exists
if not exist "%PYTHON%" (
    echo ERROR: Python not found at %PYTHON%
    pause
    exit /b 1
)

REM Run migrations
echo Running database migrations...
"%PYTHON%" manage.py migrate --run-syncdb

REM Start the server
echo.
echo Starting Django development server...
echo Backend URL: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

"%PYTHON%" manage.py runserver 0.0.0.0:8000
