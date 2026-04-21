@echo off
REM FitFeast Backend Server Launcher

set PYTHON=C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe
set BACKEND_DIR=C:\Users\salah\OneDrive\Desktop\Fit Feast\backend\fitfeast_backend

cd /d "%BACKEND_DIR%"

echo.
echo ================================================
echo  FitFeast Django Backend
echo ================================================
echo.

"%PYTHON%" server.py

pause
