#!/usr/bin/env python
"""
Script to make an existing user an admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')
django.setup()

from users.models import User

username = "Lachheb"

try:
    user = User.objects.get(username=username)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"✅ {user.username} is now admin!")
    print(f"   You can now access: http://localhost:3000/admin")
except User.DoesNotExist:
    print(f"❌ User '{username}' not found")
except Exception as e:
    print(f"❌ Error: {e}")
