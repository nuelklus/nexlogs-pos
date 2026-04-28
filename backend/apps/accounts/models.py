from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    PRO_CONTRACTOR = "PRO_CONTRACTOR", "Pro-Contractor"
    ADMIN = "ADMIN", "Admin"

class User(AbstractUser):
    email = models.EmailField(unique=True)  # Make email unique
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=32, unique=True, blank=True, null=True)

    def is_pro_contractor(self) -> bool:
        return self.role == UserRole.PRO_CONTRACTOR

    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN