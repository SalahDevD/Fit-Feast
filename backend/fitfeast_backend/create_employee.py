#!/usr/bin/env python
"""
Script to create an employee user for testing the employee dashboard.
Run this after starting the Django server.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')
django.setup()

from users.models import User

def create_employee_user():
    """Create an employee user for testing"""
    username = "employee"
    email = "employee@fitfeast.com"
    password = "employee123"
    
    # Check if employee already exists
    if User.objects.filter(username=username).exists():
        print(f"Employee user '{username}' already exists.")
        return
    
    # Create employee user
    employee_user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name="Jean",
        last_name="Chef",
        is_employee=True
    )
    
    print(f"✅ Employee user created successfully!")
    print(f"   Username: {username}")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"\n   Access employee dashboard at: http://localhost:3000/employee")

if __name__ == "__main__":
    create_employee_user()
