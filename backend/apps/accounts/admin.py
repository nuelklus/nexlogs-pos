from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "Hardware E-commerce",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "staff_role",
                )
            },
        ),
    )
    list_display = ("username", "email", "role", "staff_role", "is_active")
    list_filter = ("role", "staff_role", "is_active")
