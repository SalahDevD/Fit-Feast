#!/usr/bin/env python
"""
FitFeast Backend Launcher
Initializes PyMySQL properly before Django loads
"""
import os
import sys

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Initialize PyMySQL FIRST - before anything else imports Django
try:
    import pymysql
    pymysql.install_as_MySQLdb()
    print("[✓] PyMySQL installed as MySQLdb")
    
    # Patch the version to bypass Django's check
    import MySQLdb
    MySQLdb.__version__ = '2.2.8'
    MySQLdb.version_info = (2, 2, 8, 'final', 0)
    
except ImportError:
    print("[!] PyMySQL not available, using mysqlclient")
except Exception as e:
    print(f"[!] Warning initializing PyMySQL: {e}")

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')

# Setup Django
import django
django.setup()

# Run the development server
if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    
    print("\n" + "="*50)
    print("  FitFeast Django Backend Server")
    print("="*50)
    print("\n[●] Server starting on http://localhost:8000")
    print("[●] Press Ctrl+C to stop\n")
    
    # Run migrations first
    print("[...] Running migrations...")
    try:
        execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
    except SystemExit:
        pass
    
    # Start the server
    print("\n[●] Starting development server...\n")
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
