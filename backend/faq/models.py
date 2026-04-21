from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

# PostgreSQL-specific imports removed for MySQL compatibility


def _slug(model_cls, raw: str) -> str:
    base = slugify(raw)[:60] or uuid.uuid4().hex[:12]
    slug = base
    if model_cls.objects.filter(slug=slug).exists():
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
    return slug


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class FAQCategory(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    class Meta:
        verbose_name = _("Catégorie FAQ")
        verbose_name_plural = _("Catégories FAQ")
        indexes = [models.Index(fields=["slug"], name="faqcat_slug_idx")]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _slug(FAQCategory, self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class FAQEntry(TimeStampedModel):
    """
    FAQ intelligente évolutive (6.13).
    - SearchVectorField + GIN pour recherche full-text (PostgreSQL) citeturn3view4turn4view0
    - Embedding: ArrayField(float) en placeholder. Pour recherche vectorielle sérieuse, recommander pgvector (amélioration).
    """
    category = models.ForeignKey(FAQCategory, on_delete=models.PROTECT, related_name="entries")

    language = models.CharField(max_length=10, default="fr")
    question = models.TextField()
    answer = models.TextField()

    is_published = models.BooleanField(default=True)

    # Mots-clés "light" as JSON
    keywords = models.JSONField(default=list, blank=True)

    # Placeholder "embedding" as JSON (MySQL compatible)
    embedding = models.JSONField(null=True, blank=True)
    # Feedback counters
    helpful_count = models.PositiveIntegerField(default=0)
    not_helpful_count = models.PositiveIntegerField(default=0)
    class Meta:
        verbose_name = _("Entrée FAQ")
        verbose_name_plural = _("Entrées FAQ")
        indexes = [
            models.Index(fields=["is_published", "language"], name="faq_pub_lang_idx"),
        ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.question[:60]


class FAQFeedback(TimeStampedModel):
    entry = models.ForeignKey(FAQEntry, on_delete=models.CASCADE, related_name="feedbacks")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    was_helpful = models.BooleanField(default=True)
    comment = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _("Feedback FAQ")
        verbose_name_plural = _("Feedbacks FAQ")
        indexes = [
            models.Index(fields=["entry", "created_at"], name="faqfb_entry_created_idx"),
        ]

    def __str__(self) -> str:
        return f"FAQFeedback({self.was_helpful})"

