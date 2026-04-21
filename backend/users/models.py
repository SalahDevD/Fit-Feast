from __future__ import annotations

import uuid
from decimal import Decimal

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


PHONE_VALIDATOR = RegexValidator(
    regex=r"^\+?[0-9\s\-\(\)]{7,20}$",
    message=_("Numéro de téléphone invalide."),
)


class TimeStampedModel(models.Model):
    """Mixin standard : audit par timestamps."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserQuerySet(models.QuerySet):
    def active(self) -> "UserQuerySet":
        return self.filter(is_active=True)

    def customers(self) -> "UserQuerySet":
        return self.filter(role=User.Role.CUSTOMER)

    def employees(self) -> "UserQuerySet":
        return self.filter(role__in=[User.Role.EMPLOYEE, User.Role.ADMIN])


class UserManager(BaseUserManager.from_queryset(UserQuerySet)):
    """
    Manager compatible avec USERNAME_FIELD=email.
    Remarque : on garde la logique standard Django (is_staff/is_superuser).
    """
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("email doit être renseigné.")
        email = self.normalize_email(email)
        
        # Auto-generate username from email if not provided
        if not extra_fields.get('username'):
            extra_fields['username'] = email.split('@')[0]

        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        # full_clean() ici est utile en API, mais peut être coûteux en bulk.
        user.full_clean(exclude={"password"})
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", User.Role.CUSTOMER)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser doit avoir is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Modèle utilisateur Fit Feast.
    - Identifiant: email
    - Multi-rôles: client / employé / admin
    """

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", _("Client")
        EMPLOYEE = "EMPLOYEE", _("Employé")
        ADMIN = "ADMIN", _("Administrateur")

    class Language(models.TextChoices):
        FR = "fr", _("Français")
        EN = "en", _("English")

    # On remplace username par email
    username = models.CharField(
        _("username"),
        max_length=150,
        blank=True,
        null=True
    )
    email = models.EmailField(_("email"), unique=True, db_index=True)

    role = models.CharField(max_length=16, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=32, blank=True, validators=[PHONE_VALIDATOR])

    language = models.CharField(max_length=10, choices=Language.choices, default=Language.FR)
    dark_mode = models.BooleanField(default=False)
    timezone = models.CharField(max_length=64, default="Africa/Casablanca")

    # Profil nutritionnel (facultatif)
    height_cm = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(50), MaxValueValidator(260)],
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("20.00")), MaxValueValidator(Decimal("300.00"))],
    )

    marketing_opt_in = models.BooleanField(default=False)

    # date_joined existe déjà sur AbstractUser ; on ajoute updated_at via mixin-like
    profile_updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        verbose_name = _("Utilisateur")
        verbose_name_plural = _("Utilisateurs")
        indexes = [
            models.Index(fields=["role"], name="users_role_idx"),
            models.Index(fields=["is_active"], name="users_active_idx"),
        ]

    def __str__(self) -> str:
        return self.email

    @property
    def is_employee(self) -> bool:
        return self.role in {self.Role.EMPLOYEE, self.Role.ADMIN}

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN


class UserAddress(TimeStampedModel):
    """
    Adresse de livraison (snapshot/freeze au moment de la commande conseillé).
    """
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="addresses")

    label = models.CharField(max_length=50, blank=True)  # ex: "Maison", "Bureau"
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=32, blank=True, validators=[PHONE_VALIDATOR])

    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120)
    region = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country_code = models.CharField(max_length=2, default="MA")  # ISO-3166-1 alpha-2 (assumption)

    delivery_instructions = models.CharField(max_length=255, blank=True)

    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("Adresse utilisateur")
        verbose_name_plural = _("Adresses utilisateurs")
        constraints = [
            # Un seul défaut par utilisateur (PostgreSQL: contrainte conditionnelle)
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(is_default=True),
                name="uniq_default_address_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "is_default"], name="addr_user_default_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.label or 'Adresse'}"

