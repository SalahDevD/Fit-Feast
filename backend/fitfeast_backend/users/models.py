from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    allergies = models.JSONField(default=list, blank=True)
    loyalty_points = models.IntegerField(default=0)
    dietary_preferences = models.JSONField(default=list, blank=True)
    is_employee = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.username} - {self.email}"
