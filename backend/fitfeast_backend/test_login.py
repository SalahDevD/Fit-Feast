#!/usr/bin/env python
"""
Quick test script to verify login functionality
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from users.models import User
from rest_framework.authtoken.models import Token

def test_login():
    """Test if login works"""
    print("Testing login functionality...\n")
    
    # Check if admin user exists
    try:
        user = User.objects.get(username='admin')
        print(f"✓ User 'admin' found")
        print(f"  - Email: {user.email}")
        print(f"  - Is Staff: {user.is_staff}")
        print(f"  - Is Employee: {user.is_employee}")
        print(f"  - Is Active: {user.is_active}")
    except User.DoesNotExist:
        print("✗ User 'admin' not found")
        print("  Run: python create_admin.py")
        return
    
    # Test authentication
    auth_user = authenticate(username='admin', password='admin123')
    if auth_user:
        print(f"\n✓ Authentication successful")
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=auth_user)
        print(f"✓ Token obtained: {token.key[:20]}...")
        
        print("\n✓ Login should work now!")
        print("\nTest login in browser:")
        print("  1. Navigate to http://localhost:3000/login")
        print("  2. Username: admin")
        print("  3. Password: admin123")
        print("  4. You should see the admin dashboard button appear in the header")
        
    else:
        print("\n✗ Authentication failed")
        print("  Check username and password")

if __name__ == '__main__':
    test_login()
