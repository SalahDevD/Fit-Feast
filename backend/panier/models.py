from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q, F, Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Cart(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", _("Ouvert")
        CHECKED_OUT = "CHECKED_OUT", _("Converti en commande")
        ABANDONED = "ABANDONED", _("Abandonné")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)

    currency = models.CharField(max_length=3, default="MAD")
    expires_at = models.DateTimeField(null=True, blank=True)

    # Totaux calculés (snapshot) pour UI rapide
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_items = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _("Panier")
        verbose_name_plural = _("Paniers")
        constraints = [
            # Un seul panier OPEN par user (contraintes conditionnelles).
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(status="OPEN"),
                name="uniq_open_cart_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status"], name="cart_user_status_idx"),
        ]

    def __str__(self) -> str:
        return f"Cart({self.user}, {self.status})"

    def recalculate_totals(self, save: bool = True) -> None:
        agg = self.items.aggregate(
            subtotal=Sum(F("line_total")),
            total_items=Sum(F("quantity")),
        )
        self.subtotal = agg["subtotal"] or Decimal("0.00")
        self.total_items = int(agg["total_items"] or 0)

        if save:
            self.save(update_fields=["subtotal", "total_items", "updated_at"])


class CartItem(TimeStampedModel):
    """
    Un item est soit Dish, soit CustomDish (XOR).
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")

    dish = models.ForeignKey("plats.Dish", null=True, blank=True, on_delete=models.PROTECT)
    custom_dish = models.ForeignKey("personnalisation.CustomDish", null=True, blank=True, on_delete=models.PROTECT)

    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(50)])

    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    line_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    # Snapshot pour la stabilité (nom, macros, etc.)
    item_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Item panier")
        verbose_name_plural = _("Items panier")
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(dish__isnull=False) & Q(custom_dish__isnull=True))
                    | (Q(dish__isnull=True) & Q(custom_dish__isnull=False))
                ),
                name="check_cartitem_xor_product",
            ),
        ]
        indexes = [
            models.Index(fields=["cart"], name="cartitem_cart_idx"),
        ]

    def __str__(self) -> str:
        return f"CartItem({self.cart_id}, qty={self.quantity})"

    def recalculate_line(self, save: bool = True) -> None:
        self.line_total = (self.unit_price * Decimal(self.quantity))
        if save:
            self.save(update_fields=["line_total", "updated_at"])

