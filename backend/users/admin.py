from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserAddress

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('role', 'phone', 'dark_mode', 'language', 'timezone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {'fields': ('role', 'phone', 'email')}),
    )
    ordering = ('email',)

admin.site.register(User, CustomUserAdmin)
admin.site.register(UserAddress)