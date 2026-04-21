from __future__ import annotations

from datetime import date, timedelta

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def week_start(d: date) -> date:
    # Lundi comme début de semaine (assumption)
    return d - timedelta(days=d.weekday())


class MealPlan(TimeStampedModel):
    """
    Planning hebdomadaire (meal prep).
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="meal_plans")
    week_start_date = models.DateField()

    goal = models.JSONField(default=dict, blank=True)  # ex: cibles macros, objectifs

    class Meta:
        verbose_name = _("Plan repas")
        verbose_name_plural = _("Plans repas")
        constraints = [
            models.UniqueConstraint(fields=["user", "week_start_date"], name="uniq_user_week_plan"),
        ]
        indexes = [
            models.Index(fields=["user", "week_start_date"], name="plan_user_week_idx"),
        ]

    def save(self, *args, **kwargs):
        self.week_start_date = week_start(self.week_start_date)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user} — semaine {self.week_start_date}"


class MealPlanItem(TimeStampedModel):
    class MealType(models.TextChoices):
        BREAKFAST = "BREAKFAST", _("Petit-déjeuner")
        LUNCH = "LUNCH", _("Déjeuner")
        DINNER = "DINNER", _("Dîner")
        SNACK = "SNACK", _("Snack")

    plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name="items")
    day = models.DateField()
    meal_type = models.CharField(max_length=10, choices=MealType.choices)

    dish = models.ForeignKey("plats.Dish", null=True, blank=True, on_delete=models.PROTECT)
    custom_dish = models.ForeignKey("personnalisation.CustomDish", null=True, blank=True, on_delete=models.PROTECT)

    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _("Élément plan repas")
        verbose_name_plural = _("Éléments plan repas")
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(dish__isnull=False) & Q(custom_dish__isnull=True))
                    | (Q(dish__isnull=True) & Q(custom_dish__isnull=False))
                ),
                name="check_mealplanitem_xor_product",
            ),
            models.UniqueConstraint(fields=["plan", "day", "meal_type"], name="uniq_plan_day_mealtype"),
        ]
        indexes = [
            models.Index(fields=["plan", "day"], name="mealplan_day_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.plan} — {self.day} {self.meal_type}"

