try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
except Exception as e:
    print(f"Warning: Could not initialize PyMySQL: {e}")