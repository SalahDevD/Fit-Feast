@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\salah\OneDrive\Desktop\Fit Feast\backend\fitfeast_backend"

echo.
echo ==============================================
echo Starting FitFeast Django Backend
echo ==============================================
echo.

REM Run migrations first
echo Running database migrations...
"C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe" manage.py migrate

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Migrations failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Migrations completed successfully!
echo.
echo Starting Django development server...
echo Backend will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

"C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe" manage.py runserver 0.0.0.0:8000

pause
