#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Initialize PyMySQL as MySQLdb replacement before Django loads
try:
    import pymysql
    pymysql.install_as_MySQLdb()
    # Aggressive patching to bypass version check
    import MySQLdb
    MySQLdb.__version__ = '2.2.1'
except ImportError:
    pass
except Exception:
    pass


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
