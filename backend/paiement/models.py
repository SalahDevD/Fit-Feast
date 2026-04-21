from __future__ import annotations

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def generate_invoice_number() -> str:
    return f"INV-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PaymentIntent(TimeStampedModel):
    """
    Abstraction de transaction (Stripe/PayPal/CMI/etc).
    Le payload JSON stocke la réponse provider (utile pour audit/debug).
    JSONField sur Postgres = jsonb ; index GIN recommandé selon requêtes. citeturn4view0turn5view4
    """
    class Provider(models.TextChoices):
        STRIPE = "STRIPE", "Stripe"
        PAYPAL = "PAYPAL", "PayPal"
        CMI = "CMI", "CMI"
        CASH = "CASH", _("Paiement à la livraison")

    class Status(models.TextChoices):
        CREATED = "CREATED", _("Créé")
        REQUIRES_ACTION = "REQUIRES_ACTION", _("Action requise")
        SUCCEEDED = "SUCCEEDED", _("Réussi")
        FAILED = "FAILED", _("Échoué")
        CANCELED = "CANCELED", _("Annulé")

    order = models.OneToOneField("commandes.Order", on_delete=models.CASCADE, related_name="payment_intent")

    provider = models.CharField(max_length=12, choices=Provider.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)

    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    currency = models.CharField(max_length=3, default="MAD")

    provider_reference = models.CharField(max_length=100, blank=True)  # ex: payment_intent_id
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Paiement")
        verbose_name_plural = _("Paiements")
        indexes = [
            models.Index(fields=["status", "created_at"], name="pay_status_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.provider} {self.status} {self.amount} {self.currency}"


class Invoice(TimeStampedModel):
    """
    Facture PDF par commande (version simple).
    Pour mode entreprise (facture unique groupée), voir entreprise.CompanyInvoice.
    """
    order = models.OneToOneField("commandes.Order", on_delete=models.PROTECT, related_name="invoice")

    invoice_number = models.CharField(max_length=32, unique=True, default=generate_invoice_number, editable=False)
    issued_at = models.DateTimeField(default=timezone.now)

    billing_name = models.CharField(max_length=200, blank=True)
    billing_address = models.CharField(max_length=255, blank=True)
    vat_number = models.CharField(max_length=40, blank=True)

    pdf_file = models.FileField(upload_to="invoices/", blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    currency = models.CharField(max_length=3, default="MAD")

    class Meta:
        verbose_name = _("Facture")
        verbose_name_plural = _("Factures")
        indexes = [
            models.Index(fields=["issued_at"], name="invoice_issued_idx"),
        ]

    def __str__(self) -> str:
        return self.invoice_number

