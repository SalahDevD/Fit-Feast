@echo off
cd "c:\Users\salah\OneDrive\Desktop\Fit Feast\backend\fitfeast_backend"
"C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe" manage.py migrate
"C:\Users\salah\AppData\Local\Programs\Python\Python314\python.exe" manage.py runserver
pause
