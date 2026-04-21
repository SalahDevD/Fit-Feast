#!/usr/bin/env python
"""
FitFeast Backend - MySQL Launcher
Properly patches MySQLdb version check before Django loads
"""
import os
import sys

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

print("\n" + "="*60)
print("  FitFeast Django Backend - MySQL Edition")
print("="*60 + "\n")

# Step 1: Initialize PyMySQL BEFORE Django imports
print("[1/4] Initializing PyMySQL...")
try:
    import pymysql
    pymysql.install_as_MySQLdb()
    print("      ✓ PyMySQL installed as MySQLdb")
except Exception as e:
    print(f"      ✗ Error: {e}")
    sys.exit(1)

# Step 2: Patch MySQLdb version before Django loads it
print("[2/4] Patching MySQLdb version...")
try:
    import MySQLdb
    original_version = MySQLdb.__version__ if hasattr(MySQLdb, '__version__') else 'unknown'
    MySQLdb.__version__ = '2.2.8'
    MySQLdb.version_info = (2, 2, 8, 'final', 0)
    print(f"      ✓ Version patched (was: {original_version}, now: 2.2.8)")
except Exception as e:
    print(f"      ! Warning: {e}")

# Step 3: Patch Django's MySQL backend BEFORE it checks version
print("[3/4] Patching Django MySQL backend...")
try:
    # Pre-import the MySQL backend module to apply our patches
    import django.db.backends.mysql.base as mysql_base
    
    # Override the version check function
    original_init = mysql_base.DatabaseWrapper.__init__
    
    def patched_init(self, *args, **kwargs):
        """Patched init that sets correct MySQLdb version"""
        # Ensure MySQLdb has correct version before parent init
        try:
            import MySQLdb
            MySQLdb.__version__ = '2.2.8'
            MySQLdb.version_info = (2, 2, 8, 'final', 0)
        except:
            pass
        return original_init(self, *args, **kwargs)
    
    mysql_base.DatabaseWrapper.__init__ = patched_init
    print("      ✓ Django MySQL backend patched")
except Exception as e:
    print(f"      ! Warning: {e}")

# Step 4: Setup Django
print("[4/4] Loading Django...")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')

try:
    import django
    django.setup()
    print("      ✓ Django initialized")
except Exception as e:
    print(f"      ✗ Error: {e}")
    sys.exit(1)

# Start server
if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    
    print("\n" + "="*60)
    print("  Server Configuration")
    print("="*60)
    print("• Backend URL: http://localhost:8000")
    print("• Database: MySQL (fitfeast)")
    print("• Host: localhost:3306")
    print("• Press Ctrl+C to stop")
    print("="*60 + "\n")
    
    try:
        execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")
        sys.exit(0)
