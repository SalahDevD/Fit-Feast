from __future__ import annotations

import uuid

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def _ensure_slug(model_cls: type[models.Model], raw: str, slug_field: str = "slug") -> str:
    """
    Génère un slug unique. Conflits résolus via suffix uuid court.
    """
    base = slugify(raw)[:60] or uuid.uuid4().hex[:12]
    slug = base
    if model_cls.objects.filter(**{slug_field: slug}).exists():
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
    return slug


class Allergen(TimeStampedModel):
    """
    Allergen de référence (arachide, gluten, lactose, etc.)
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = _("Allergène")
        verbose_name_plural = _("Allergènes")
        indexes = [models.Index(fields=["slug"], name="allergen_slug_idx")]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _ensure_slug(Allergen, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class DietType(TimeStampedModel):
    """
    Régime / contrainte alimentaire (vegan, halal, sans gluten...)
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = _("Régime alimentaire")
        verbose_name_plural = _("Régimes alimentaires")
        indexes = [models.Index(fields=["slug"], name="diet_slug_idx")]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _ensure_slug(DietType, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class UserAllergy(TimeStampedModel):
    class Severity(models.TextChoices):
        MILD = "MILD", _("Légère")
        MODERATE = "MODERATE", _("Modérée")
        SEVERE = "SEVERE", _("Sévère")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="allergy_links")
    allergen = models.ForeignKey(Allergen, on_delete=models.PROTECT, related_name="user_links")

    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MODERATE)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _("Allergie utilisateur")
        verbose_name_plural = _("Allergies utilisateur")
        constraints = [
            models.UniqueConstraint(fields=["user", "allergen"], name="uniq_user_allergen"),
        ]
        indexes = [
            models.Index(fields=["user", "severity"], name="user_allergy_sev_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user} - {self.allergen} ({self.severity})"


class UserDiet(TimeStampedModel):
    class StrictLevel(models.TextChoices):
        PREFERENCE = "PREFERENCE", _("Préférence")
        STRICT = "STRICT", _("Strict")
        MEDICAL = "MEDICAL", _("Médical")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diet_links")
    diet = models.ForeignKey(DietType, on_delete=models.PROTECT, related_name="user_links")

    strict_level = models.CharField(max_length=12, choices=StrictLevel.choices, default=StrictLevel.PREFERENCE)

    class Meta:
        verbose_name = _("Régime utilisateur")
        verbose_name_plural = _("Régimes utilisateur")
        constraints = [
            models.UniqueConstraint(fields=["user", "diet"], name="uniq_user_diet"),
        ]
        indexes = [
            models.Index(fields=["user", "strict_level"], name="user_diet_level_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user} - {self.diet} ({self.strict_level})"

