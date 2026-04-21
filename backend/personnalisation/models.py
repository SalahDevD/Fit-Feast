from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q, Sum, F
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ComponentGroup(TimeStampedModel):
    """
    Groupe d’options (protéines, légumes, accompagnements, cuisson...)
    """
    class Kind(models.TextChoices):
        PROTEIN = "PROTEIN", _("Protéine")
        VEGETABLE = "VEGETABLE", _("Légume")
        SIDE = "SIDE", _("Accompagnement")
        SAUCE = "SAUCE", _("Sauce")
        COOKING = "COOKING", _("Mode de cuisson")

    kind = models.CharField(max_length=12, choices=Kind.choices)
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Groupe de composants")
        verbose_name_plural = _("Groupes de composants")
        constraints = [
            models.UniqueConstraint(fields=["kind", "name"], name="uniq_group_kind_name"),
        ]
        indexes = [
            models.Index(fields=["kind", "is_active"], name="group_kind_active_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.get_kind_display()} — {self.name}"


class ComponentItem(TimeStampedModel):
    """
    Option sélectionnable (ex: "Poulet", "Tofu", "Brocoli", "Riz", "Grillé").
    Macros par portion (approx) + impact prix.
    """
    group = models.ForeignKey(ComponentGroup, on_delete=models.PROTECT, related_name="items")

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    # Macros par portion
    calories_kcal = models.PositiveIntegerField(default=0)
    protein_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    carbs_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    fat_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))

    price_delta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        # prix delta peut être négatif (ex: retirer un ingrédient) — on borne.
        validators=[MinValueValidator(Decimal("-1000.00")), MaxValueValidator(Decimal("1000.00"))],
    )
    currency = models.CharField(max_length=3, default="MAD")

    # Lien optionnel vers un ingrédient catalogue (ex: "Poulet" = Ingredient)
    ingredient = models.ForeignKey("plats.Ingredient", null=True, blank=True, on_delete=models.SET_NULL)

    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Composant")
        verbose_name_plural = _("Composants")
        constraints = [
            models.UniqueConstraint(fields=["group", "name"], name="uniq_component_group_name"),
        ]
        indexes = [
            models.Index(fields=["group", "is_available"], name="component_group_avail_idx"),
        ]

    def __str__(self) -> str:
        return self.name


class DishCustomizationRule(TimeStampedModel):
    """
    Règles par plat : quels groupes sont autorisés / obligatoires et combien d’items.
    """
    dish = models.ForeignKey("plats.Dish", on_delete=models.CASCADE, related_name="customization_rules")
    group = models.ForeignKey(ComponentGroup, on_delete=models.PROTECT, related_name="dish_rules")

    min_select = models.PositiveSmallIntegerField(default=0)
    max_select = models.PositiveSmallIntegerField(default=1)

    class Meta:
        verbose_name = _("Règle de personnalisation")
        verbose_name_plural = _("Règles de personnalisation")
        constraints = [
            models.UniqueConstraint(fields=["dish", "group"], name="uniq_dish_group_rule"),
            models.CheckConstraint(
                condition=Q(min_select__lte=F("max_select")),
                name="check_min_le_max",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.dish} — {self.group} ({self.min_select}-{self.max_select})"


class CustomDish(TimeStampedModel):
    """
    Plat personnalisé (persisté pour le panier/commande et partage social).
    On stocke un snapshot calculé (prix + macros) pour stabilité.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="custom_dishes")
    base_dish = models.ForeignKey("plats.Dish", on_delete=models.PROTECT, related_name="custom_variants")

    title = models.CharField(max_length=180, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    currency = models.CharField(max_length=3, default="MAD")

    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    calories_kcal = models.PositiveIntegerField(default=0)
    protein_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    carbs_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    fat_g = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))

    # Détails de calcul (audit) : quantités, formules, warnings...
    nutrition_breakdown = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Plat personnalisé")
        verbose_name_plural = _("Plats personnalisés")
        indexes = [
            models.Index(fields=["user", "created_at"], name="customdish_user_created_idx"),
        ]

    def __str__(self) -> str:
        return self.title or f"{self.base_dish.name} (custom)"

    def recalculate_totals(self, save: bool = True) -> None:
        """
        Recalcule prix/macros à partir du plat de base + composants sélectionnés.
        Appelé typiquement après modifications des composants.
        """
        base = self.base_dish

        agg = self.components.aggregate(
            delta_price=Sum(F("component_item__price_delta") * F("quantity")),
            calories=Sum(F("component_item__calories_kcal") * F("quantity")),
            protein=Sum(F("component_item__protein_g") * F("quantity")),
            carbs=Sum(F("component_item__carbs_g") * F("quantity")),
            fat=Sum(F("component_item__fat_g") * F("quantity")),
        )

        delta_price = agg["delta_price"] or Decimal("0.00")
        add_cal = int(agg["calories"] or 0)
        add_protein = agg["protein"] or Decimal("0.00")
        add_carbs = agg["carbs"] or Decimal("0.00")
        add_fat = agg["fat"] or Decimal("0.00")

        # Totaux
        total_price = (base.base_price + delta_price)
        if total_price < 0:
            total_price = Decimal("0.00")

        self.total_price = total_price
        self.calories_kcal = int(base.calories_kcal) + add_cal
        self.protein_g = base.protein_g + add_protein
        self.carbs_g = base.carbs_g + add_carbs
        self.fat_g = base.fat_g + add_fat

        if save:
            self.save(update_fields=["total_price", "calories_kcal", "protein_g", "carbs_g", "fat_g", "updated_at"])


class CustomDishComponent(TimeStampedModel):
    """
    Association plat personnalisé -> composant choisi (avec quantité).
    """
    custom_dish = models.ForeignKey(CustomDish, on_delete=models.CASCADE, related_name="components")
    component_item = models.ForeignKey(ComponentItem, on_delete=models.PROTECT, related_name="used_in_custom_dishes")

    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(20)])
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = _("Composant sélectionné")
        verbose_name_plural = _("Composants sélectionnés")
        constraints = [
            models.UniqueConstraint(fields=["custom_dish", "component_item"], name="uniq_customdish_component"),
        ]
        indexes = [
            models.Index(fields=["custom_dish", "sort_order"], name="customdish_comp_sort_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.custom_dish} + {self.component_item} x{self.quantity}"


class ComponentChoice(TimeStampedModel):
    """
    Choix d'un composant (ex: choix de protéine, légume, accompagnement).
    Représente une option sélectionnable avec ses propriétés nutritionnelles et son impact prix.
    """
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    # Propriétés nutritionnelles
    calories = models.PositiveIntegerField(default=0)
    proteins = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    carbs = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    fats = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))

    # Impact sur le prix
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("1000.00"))],
    )
    currency = models.CharField(max_length=3, default="MAD")

    # Disponibilité
    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Choix de composant")
        verbose_name_plural = _("Choix de composants")
        indexes = [
            models.Index(fields=["name", "is_available"], name="componentchoice_name_avail_idx"),
        ]

    def __str__(self) -> str:
        return self.name

