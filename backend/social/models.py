# social/models.py
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.db.models import Q, F
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SocialPost(TimeStampedModel):
    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", _("Public")
        FRIENDS = "FRIENDS", _("Amis")
        PRIVATE = "PRIVATE", _("Privé")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="posts")

    dish = models.ForeignKey("plats.Dish", null=True, blank=True, on_delete=models.SET_NULL)
    custom_dish = models.ForeignKey("personnalisation.CustomDish", null=True, blank=True, on_delete=models.SET_NULL)

    text = models.TextField(blank=True)
    image = models.ImageField(upload_to="posts/", blank=True)
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    
    # Denormalized count fields for performance
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _("Post")
        verbose_name_plural = _("Posts")
        constraints = [
            # On autorise un post texte-only ou avec plat, mais si plat présent => XOR
            models.CheckConstraint(
                condition=(
                    Q(dish__isnull=True, custom_dish__isnull=True)
                    | (Q(dish__isnull=False) & Q(custom_dish__isnull=True))
                    | (Q(dish__isnull=True) & Q(custom_dish__isnull=False))
                ),
                name="check_post_xor_dish_optional",
            ),
        ]
        indexes = [
            models.Index(fields=["created_at", "visibility"], name="post_feed_idx"),
        ]

    def __str__(self) -> str:
        return f"Post {self.pk} — {self.user}"


class PostLike(TimeStampedModel):
    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="likes")

    class Meta:
        verbose_name = _("Like")
        verbose_name_plural = _("Likes")
        constraints = [
            models.UniqueConstraint(fields=["post", "user"], name="uniq_like_post_user"),
        ]

    def __str__(self) -> str:
        return f"{self.user} ♥ {self.post_id}"


class PostComment(TimeStampedModel):
    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="comments")

    body = models.TextField()

    class Meta:
        verbose_name = _("Commentaire")
        verbose_name_plural = _("Commentaires")
        indexes = [
            models.Index(fields=["post", "created_at"], name="comment_post_created_idx"),
        ]

    def __str__(self) -> str:
        return f"Comment {self.pk} on {self.post_id}"


class PostShare(TimeStampedModel):
    class Platform(models.TextChoices):
        LINK = "LINK", "Link"
        INSTAGRAM = "INSTAGRAM", "Instagram"
        FACEBOOK = "FACEBOOK", "Facebook"
        TIKTOK = "TIKTOK", "TikTok"
        X = "X", "X"

    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name="shares")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shares")

    platform = models.CharField(max_length=12, choices=Platform.choices, default=Platform.LINK)

    class Meta:
        verbose_name = _("Partage")
        verbose_name_plural = _("Partages")
        indexes = [
            models.Index(fields=["post", "created_at"], name="share_post_created_idx"),
        ]

    def __str__(self) -> str:
        return f"Share({self.platform})"


class Challenge(TimeStampedModel):
    """
    Défis healthy hebdomadaires (6.8).
    """
    class GoalType(models.TextChoices):
        ORDERS_COUNT = "ORDERS_COUNT", _("Nombre de commandes")
        MEALS_PLANNED = "MEALS_PLANNED", _("Repas planifiés")
        PROTEIN_TARGET = "PROTEIN_TARGET", _("Objectif protéines (g)")

    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)

    start_date = models.DateField()
    end_date = models.DateField()

    goal_type = models.CharField(max_length=20, choices=GoalType.choices)
    target_value = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Défi")
        verbose_name_plural = _("Défis")
        indexes = [
            models.Index(fields=["is_active", "start_date", "end_date"], name="challenge_active_dates_idx"),
        ]

    def __str__(self) -> str:
        return self.title


class ChallengeParticipation(TimeStampedModel):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="challenge_participations")

    progress_value = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Participation défi")
        verbose_name_plural = _("Participations défi")
        constraints = [
            models.UniqueConstraint(fields=["challenge", "user"], name="uniq_challenge_user"),
        ]

    def __str__(self) -> str:
        return f"{self.user} in {self.challenge}"

