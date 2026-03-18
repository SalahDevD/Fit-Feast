#!/usr/bin/env python
"""
Script to create an admin user for testing the admin dashboard.
Run this after starting the Django server.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')
django.setup()

from users.models import User

def create_admin_user():
    """Create an admin user for testing"""
    username = "admin"
    email = "admin@fitfeast.com"
    password = "admin123"
    
    # Check if admin already exists
    if User.objects.filter(username=username).exists():
        print(f"Admin user '{username}' already exists.")
        return
    
    # Create superuser
    admin_user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        first_name="Admin",
        last_name="User"
    )
    
    print(f"✅ Admin user created successfully!")
    print(f"   Username: {username}")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"\n   Access admin dashboard at: http://localhost:3000/admin")

if __name__ == "__main__":
    create_admin_user()
