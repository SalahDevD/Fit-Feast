# chatbot/models.py
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ChatConversation(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="chat_conversations")

    title = models.CharField(max_length=140, blank=True)
    is_active = models.BooleanField(default=True)

    # Contexte IA (profil nutritionnel dérivé, préférences, etc.)
    context = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Conversation chatbot")
        verbose_name_plural = _("Conversations chatbot")

    def __str__(self) -> str:
        return self.title or f"Conversation {self.pk}"


class ChatMessage(TimeStampedModel):
    class Role(models.TextChoices):
        USER = "USER", "user"
        ASSISTANT = "ASSISTANT", "assistant"
        SYSTEM = "SYSTEM", "system"
        TOOL = "TOOL", "tool"

    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=Role.choices)

    content = models.TextField(blank=True)

    # Vocal : stocker audio + transcription (assumption: fichier déjà traité)
    audio_file = models.FileField(upload_to="chat_audio/", blank=True)
    transcript = models.TextField(blank=True)

    # Observabilité modèle IA
    model_name = models.CharField(max_length=80, blank=True)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)

    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Message chatbot")
        verbose_name_plural = _("Messages chatbot")
        indexes = [
            models.Index(fields=["conversation", "created_at"], name="chatmsg_conv_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.role} @ {self.created_at:%Y-%m-%d %H:%M}"


class ChatRecommendation(TimeStampedModel):
    """
    Recommandation attachée à un message (ex: suggestions de plats).
    """
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name="recommendations")

    dish = models.ForeignKey("plats.Dish", null=True, blank=True, on_delete=models.PROTECT)
    custom_dish = models.ForeignKey("personnalisation.CustomDish", null=True, blank=True, on_delete=models.PROTECT)

    score = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.0000"))

    class Meta:
        verbose_name = _("Recommandation")
        verbose_name_plural = _("Recommandations")
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(dish__isnull=False) & Q(custom_dish__isnull=True))
                    | (Q(dish__isnull=True) & Q(custom_dish__isnull=False))
                ),
                name="check_chatrec_xor_product",
            ),
        ]
        indexes = [
            models.Index(fields=["message"], name="chatrec_message_idx"),
        ]

    def __str__(self) -> str:
        return f"Rec({self.score})"

