#!/usr/bin/env python
"""
Patch Django's MySQL version check to work with PyMySQL.
This bypasses the version check that fails even when PyMySQL is properly configured.
"""
import os
import sys

def patch_django_mysql():
    """Patch Django's MySQL backend to remove strict version checking"""
    pythonPath = os.environ.get('PYTHONHOME')
    if not pythonPath:
        # Try to find Python installation
        python_exe = sys.executable
        pythonPath = os.path.dirname(os.path.dirname(python_exe))
    
    django_mysql_base = os.path.join(
        pythonPath,
        'Lib' if 'site-packages' in sys.path[0] else '',
        'site-packages',
        'django',
        'db',
        'backends',
        'mysql',
        'base.py'
    )
    
    # Handle Windows paths
    django_mysql_base = os.path.normpath(django_mysql_base)
    
    print(f"Looking for Django MySQL backend at: {django_mysql_base}")
    
    if not os.path.exists(django_mysql_base):
        # Try alternate path
        from django.db.backends.mysql import base as mysql_module
        django_mysql_base = mysql_module.__file__
        print(f"Found Django MySQL backend at: {django_mysql_base}")
    
    if not os.path.exists(django_mysql_base):
        print(f"ERROR: Could not find Django MySQL backend")
        return False
    
    # Read the file
    with open(django_mysql_base, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already patched
    if 'PATCHED FOR PYMYSQL' in content:
        print("✓ Django is already patched")
        return True
    
    # Apply patch - comment out the version check
    old_code = '''version = Database.version_info
if version < (2, 2, 1):
    raise ImproperlyConfigured(
        "mysqlclient 2.2.1 or newer is required; you have %s." % Database.__version__
    )'''
    
    new_code = '''# PATCHED FOR PYMYSQL - Version check disabled
version = Database.version_info
# Version check disabled for PyMySQL compatibility
# if version < (2, 2, 1):
#     raise ImproperlyConfigured(
#         "mysqlclient 2.2.1 or newer is required; you have %s." % Database.__version__
#     )'''
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        
        # Write the patch
        with open(django_mysql_base, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✓ Django MySQL version check has been patched successfully!")
        return True
    else:
        print("⚠ Could not find the version check code to patch")
        print("This might be okay if the file structure is different")
        return False

if __name__ == '__main__':
    success = patch_django_mysql()
    sys.exit(0 if success else 1)
