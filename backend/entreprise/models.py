from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


def _slug_unique(model_cls, raw: str) -> str:
    base = slugify(raw)[:60] or uuid.uuid4().hex[:10]
    slug = base
    if model_cls.objects.filter(slug=slug).exists():
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
    return slug


def generate_company_invoice_number() -> str:
    return f"CINV-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Company(TimeStampedModel):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)

    billing_name = models.CharField(max_length=200, blank=True)
    billing_address = models.CharField(max_length=255, blank=True)
    vat_number = models.CharField(max_length=40, blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Entreprise")
        verbose_name_plural = _("Entreprises")
        indexes = [
            models.Index(fields=["slug"], name="company_slug_idx"),
            models.Index(fields=["is_active"], name="company_active_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _slug_unique(Company, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class CompanyMember(TimeStampedModel):
    class Role(models.TextChoices):
        OWNER = "OWNER", _("Propriétaire")
        ADMIN = "ADMIN", _("Admin")
        MEMBER = "MEMBER", _("Membre")

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="company_memberships")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)

    class Meta:
        verbose_name = _("Membre entreprise")
        verbose_name_plural = _("Membres entreprise")
        constraints = [
            models.UniqueConstraint(fields=["company", "user"], name="uniq_company_user"),
        ]
        indexes = [
            models.Index(fields=["company", "role"], name="company_role_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.company} — {self.user} ({self.role})"


class CompanyGroupOrder(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", _("Ouverte")
        LOCKED = "LOCKED", _("Verrouillée")
        SUBMITTED = "SUBMITTED", _("Soumise")
        DELIVERED = "DELIVERED", _("Livrée")
        CANCELED = "CANCELED", _("Annulée")

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="group_orders")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_group_orders")

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)

    delivery_date = models.DateField(null=True, blank=True)
    delivery_window = models.CharField(max_length=80, blank=True)  # ex: "12:00-13:00"
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _("Commande groupée entreprise")
        verbose_name_plural = _("Commandes groupées entreprise")
        indexes = [
            models.Index(fields=["company", "status", "delivery_date"], name="grouporder_csd_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.company} — GroupOrder {self.pk} ({self.status})"


class CompanyInvoice(TimeStampedModel):
    """
    Facture entreprise unique, liée à une commande groupée.
    """
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="invoices")
    group_order = models.OneToOneField(CompanyGroupOrder, on_delete=models.PROTECT, related_name="invoice")

    invoice_number = models.CharField(max_length=32, unique=True, default=generate_company_invoice_number, editable=False)
    issued_at = models.DateTimeField(default=timezone.now)

    pdf_file = models.FileField(upload_to="company_invoices/", blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="MAD")

    class Meta:
        verbose_name = _("Facture entreprise")
        verbose_name_plural = _("Factures entreprise")
        indexes = [
            models.Index(fields=["issued_at"], name="companyinv_issued_idx"),
        ]

    def __str__(self) -> str:
        return self.invoice_number

