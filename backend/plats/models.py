from __future__ import annotations

import uuid
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def _unique_slug(model_cls: type[models.Model], raw: str) -> str:
    base = slugify(raw)[:60] or uuid.uuid4().hex[:12]
    slug = base
    if model_cls.objects.filter(slug=slug).exists():
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
    return slug


class DishCategory(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="children"
    )
    # ✅ Added this so your viewset filter works
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Catégorie de plat")
        verbose_name_plural = _("Catégories de plats")
        constraints = [
            models.UniqueConstraint(fields=["parent", "slug"], name="uniq_category_parent_slug"),
            models.UniqueConstraint(fields=["parent", "name"], name="uniq_category_parent_name"),
        ]
        indexes = [
            models.Index(fields=["parent"], name="dishcat_parent_idx"),
            models.Index(fields=["is_active"], name="dishcat_active_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(DishCategory, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Ingredient(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField(blank=True)

    # Macros per 100g
    calories_kcal_100g = models.PositiveIntegerField(default=0)
    protein_g_100g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    carbs_g_100g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    fat_g_100g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))

    allergens = models.ManyToManyField("allergies.Allergen", blank=True, related_name="ingredients")
    compatible_diets = models.ManyToManyField("allergies.DietType", blank=True, related_name="ingredients_compatible")

    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Ingrédient")
        verbose_name_plural = _("Ingrédients")
        indexes = [
            models.Index(fields=["slug"], name="ingredient_slug_idx"),
            models.Index(fields=["is_active"], name="ingredient_active_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(Ingredient, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Dish(TimeStampedModel):
    name = models.CharField(max_length=180, unique=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)

    image = models.ImageField(upload_to="dishes/")

    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        default=Decimal("0.00"),
    )
    currency = models.CharField(max_length=3, default="MAD")
    
    preparation_time = models.PositiveIntegerField(default=15, help_text="Temps de préparation en minutes")

    calories_kcal = models.PositiveIntegerField(default=0)
    protein_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    carbs_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    fat_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))

    is_available = models.BooleanField(default=True)
    is_customizable = models.BooleanField(default=False)

    categories = models.ManyToManyField(DishCategory, blank=True, related_name="dishes")
    ingredients = models.ManyToManyField(Ingredient, through="DishIngredient", related_name="dishes")

    tags = models.JSONField(default=list, blank=True)
    extra = models.JSONField(default=dict, blank=True)

    allergens = models.ManyToManyField("allergies.Allergen", blank=True, related_name="dishes")

    class Meta:
        verbose_name = _("Plat")
        verbose_name_plural = _("Plats")
        indexes = [
            models.Index(fields=["is_available", "is_customizable"], name="dish_flags_idx"),
            models.Index(fields=["slug"], name="dish_slug_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(Dish, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class DishIngredient(TimeStampedModel):
    dish = models.ForeignKey(Dish, on_delete=models.PROTECT, related_name="dish_ingredients")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name="ingredient_in_dishes")

    quantity_g = models.PositiveIntegerField(default=0)
    is_optional = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = _("Ingrédient de plat")
        verbose_name_plural = _("Ingrédients de plat")
        constraints = [
            models.UniqueConstraint(fields=["dish", "ingredient"], name="uniq_dish_ingredient"),
        ]
        indexes = [
            models.Index(fields=["dish", "sort_order"], name="dish_ing_sort_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.dish} - {self.ingredient} ({self.quantity_g}g)"
