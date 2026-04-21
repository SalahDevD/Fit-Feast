from __future__ import annotations

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def generate_order_number() -> str:
    # Court, lisible, unique via DB unique constraint
    return f"FF-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Order(TimeStampedModel):
    # Legacy-style status codes (kept for serializer compatibility)
    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    # Modern enum-style statuses
    class Status(models.TextChoices):
        PENDING = "PENDING", _("En attente")
        PAID = "PAID", _("Payée")
        PREPARING = "PREPARING", _("Préparée")
        DELIVERED = "DELIVERED", _("Livrée")
        CANCELED = "CANCELED", _("Annulée")
        REFUNDED = "REFUNDED", _("Remboursée")

    class DeliveryType(models.TextChoices):
        DELIVERY = "DELIVERY", _("Livraison")
        PICKUP = "PICKUP", _("À emporter")
        COMPANY = "COMPANY", _("Livraison entreprise")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")

    company_group_order = models.ForeignKey(
        "entreprise.CompanyGroupOrder",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )

    order_number = models.CharField(max_length=32, unique=True, default=generate_order_number, editable=False)

    # 👇 Use the enum choices for the actual field
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    currency = models.CharField(max_length=3, default="MAD")

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    delivery_type = models.CharField(max_length=10, choices=DeliveryType.choices, default=DeliveryType.DELIVERY)
    requested_delivery_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    recipient_name = models.CharField(max_length=150, blank=True)
    recipient_phone = models.CharField(max_length=32, blank=True)
    addr_line1 = models.CharField(max_length=255, blank=True)
    addr_line2 = models.CharField(max_length=255, blank=True)
    addr_city = models.CharField(max_length=120, blank=True)
    addr_region = models.CharField(max_length=120, blank=True)
    addr_postal_code = models.CharField(max_length=20, blank=True)
    addr_country_code = models.CharField(max_length=2, blank=True)

    notes = models.CharField(max_length=255, blank=True)

    assigned_employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_orders",
    )

    class Meta:
        verbose_name = _("Commande")
        verbose_name_plural = _("Commandes")
        indexes = [
            models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
            models.Index(fields=["user", "created_at"], name="order_user_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(total_amount__gte=Decimal("0.00")),
                name="check_order_total_nonnegative",
            ),
        ]

    def __str__(self) -> str:
        return self.order_number

    def recalculate_totals(self, save: bool = True) -> None:
        subtotal = self.items.aggregate(s=models.Sum("line_total"))["s"] or Decimal("0.00")
        self.subtotal = subtotal
        self.total_amount = (self.subtotal + self.tax_amount + self.delivery_fee)
        if save:
            self.save(update_fields=["subtotal", "total_amount", "updated_at"])

    def set_status(self, new_status: str, actor=None, note: str = "") -> None:
        old = self.status
        if old == new_status:
            return
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        OrderStatusEvent.objects.create(order=self, from_status=old, to_status=new_status, actor=actor, note=note)


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    dish = models.ForeignKey("plats.Dish", null=True, blank=True, on_delete=models.PROTECT)
    custom_dish = models.ForeignKey("personnalisation.CustomDish", null=True, blank=True, on_delete=models.PROTECT)

    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    line_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    item_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Ligne de commande")
        verbose_name_plural = _("Lignes de commande")
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(dish__isnull=False) & Q(custom_dish__isnull=True))
                    | (Q(dish__isnull=True) & Q(custom_dish__isnull=False))
                ),
                name="check_orderitem_xor_product",
            ),
        ]
        indexes = [
            models.Index(fields=["order"], name="orderitem_order_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.order.order_number} x{self.quantity}"

    def get_total(self) -> Decimal:
        """Retourne le total pour cet item (line_total)"""
        return self.line_total

    def recalculate_line(self, save: bool = True) -> None:
        self.line_total = (self.unit_price * Decimal(self.quantity))
        if save:
            self.save(update_fields=["line_total", "updated_at"])


class OrderStatusEvent(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    from_status = models.CharField(max_length=12, blank=True)
    to_status = models.CharField(max_length=12)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _("Évènement commande")
        verbose_name_plural = _("Évènements commande")
        indexes = [
            models.Index(fields=["order", "created_at"], name="order_event_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.order.order_number}: {self.from_status}->{self.to_status}"
