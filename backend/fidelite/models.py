from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.db.models import Q
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class LoyaltyAccount(TimeStampedModel):
    class Tier(models.TextChoices):
        BRONZE = "BRONZE", "Bronze"
        SILVER = "SILVER", "Silver"
        GOLD = "GOLD", "Gold"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loyalty_account")
    points_balance = models.IntegerField(default=0)
    tier = models.CharField(max_length=10, choices=Tier.choices, default=Tier.BRONZE)

    class Meta:
        verbose_name = _("Compte fidélité")
        verbose_name_plural = _("Comptes fidélité")
        indexes = [
            models.Index(fields=["points_balance"], name="loyalty_points_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user} ({self.points_balance} pts)"

    def apply_delta(self, delta_points: int, reason: str, order=None) -> "LoyaltyTransaction":
        with transaction.atomic():
            self.points_balance = models.F("points_balance") + delta_points
            self.save(update_fields=["points_balance", "updated_at"])
            self.refresh_from_db(fields=["points_balance"])
            return LoyaltyTransaction.objects.create(
                account=self,
                delta_points=delta_points,
                reason=reason,
                order=order,
            )


class LoyaltyTransaction(TimeStampedModel):
    account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name="transactions")
    order = models.ForeignKey("commandes.Order", null=True, blank=True, on_delete=models.SET_NULL)
    delta_points = models.IntegerField()  # signé : +earn / -spend
    reason = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name = _("Transaction fidélité")
        verbose_name_plural = _("Transactions fidélité")
        indexes = [
            models.Index(fields=["account", "created_at"], name="loyalty_tx_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.account.user}: {self.delta_points} pts"


class Reward(TimeStampedModel):
    class RewardType(models.TextChoices):
        DISCOUNT_PERCENT = "DISCOUNT_PERCENT", _("Réduction (%)")
        FREE_DISH = "FREE_DISH", _("Plat gratuit")

    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    reward_type = models.CharField(max_length=20, choices=RewardType.choices)
    points_cost = models.PositiveIntegerField(default=100)

    discount_percent = models.PositiveSmallIntegerField(null=True, blank=True)
    dish = models.ForeignKey("plats.Dish", null=True, blank=True, on_delete=models.PROTECT)

    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Récompense")
        verbose_name_plural = _("Récompenses")
        constraints = [
            models.CheckConstraint(condition=Q(points_cost__gt=0), name="check_reward_cost_gt_0"),
        ]
        indexes = [
            models.Index(fields=["reward_type", "is_active"], name="reward_type_active_idx"),
        ]

    def __str__(self) -> str:
        return self.name


class RewardRedemption(TimeStampedModel):
    class Status(models.TextChoices):
        RESERVED = "RESERVED", _("Réservée")
        USED = "USED", _("Utilisée")
        CANCELED = "CANCELED", _("Annulée")

    reward = models.ForeignKey(Reward, on_delete=models.PROTECT, related_name="redemptions")
    account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name="redemptions")
    order = models.ForeignKey("commandes.Order", null=True, blank=True, on_delete=models.SET_NULL)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.RESERVED)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Utilisation récompense")
        verbose_name_plural = _("Utilisations récompense")
        indexes = [
            models.Index(fields=["account", "created_at"], name="redeem_account_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.account.user} -> {self.reward} ({self.status})"


# ========== SIGNaux ==========
# Recommandation "propre": mettre ces receivers dans fidelite/apps.py ready()
# Mais ils fonctionnent ici tant que l'app est importée au démarrage.

@receiver(post_save, dispatch_uid="fidelite_create_account_on_user_create")
def create_loyalty_on_user_create(sender, instance, created, **kwargs):
    # Evite AppRegistryNotReady : on filtre par label au runtime
    if sender._meta.label_lower != settings.AUTH_USER_MODEL.lower():
        return
    if created:
        LoyaltyAccount.objects.get_or_create(user=instance)


@receiver(post_save, dispatch_uid="fidelite_award_points_on_order_paid")
def award_points_on_order_paid(sender, instance, created, **kwargs):
    # Award points quand une commande passe à PAID.
    # Assumption: 1 point par 10 MAD de total_amount, arrondi à l'entier inférieur.
    if sender._meta.label_lower != "commandes.order":
        return

    order = instance
    if order.status != "PAID":
        return

    # Eviter doubles crédits : on enregistre une transaction "EARN_ORDER_<order_number>"
    reason = f"EARN_ORDER_{order.order_number}"
    account = getattr(order.user, "loyalty_account", None)
    if not account:
        account = LoyaltyAccount.objects.create(user=order.user)

    if LoyaltyTransaction.objects.filter(account=account, reason=reason).exists():
        return

    points = int((order.total_amount or Decimal("0.00")) // Decimal("10.00"))
    if points <= 0:
        return

    account.apply_delta(points, reason=reason, order=order)

