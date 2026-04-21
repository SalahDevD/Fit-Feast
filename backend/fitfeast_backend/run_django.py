#!/usr/bin/env python
"""
Startup script for running Django with PyMySQL compatibility.
This script patches MySQLdb version before Django loads.
"""
import os
import sys
import subprocess

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Install PyMySQL as MySQLdb FIRST
try:
    import pymysql
    pymysql.install_as_MySQLdb()
    print("[INFO] PyMySQL installed as MySQLdb")
except ImportError:
    print("[WARNING] PyMySQL not found")
    sys.exit(1)

# Patch MySQLdb version module
try:
    import MySQLdb
    # Use a higher version number to pass Django's >= 2.2.1 check
    MySQLdb.__version__ = '2.2.3'
    print("[INFO] MySQLdb version patched to 2.2.3")
except Exception as e:
    print(f"[WARNING] Could not patch MySQLdb version: {e}")

# Monkey-patch Django's version check
try:
    import django
    from django.db.backends.mysql import base as mysql_base
    original_check = getattr(mysql_base, '_get_mysql_version', None)
    
    def patched_version_check(*args, **kwargs):
        """Always return a compatible version tuple"""
        return (2, 2, 3)
    
    if original_check:
        mysql_base._get_mysql_version = patched_version_check
    print("[INFO] Django MySQLdb version check patched")
except Exception as e:
    print(f"[INFO] Could not patch Django: {e} (this may be okay)")

# Now run Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')

from django.core.management import execute_from_command_line

if __name__ == '__main__':
    # Run the server or specified command
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
