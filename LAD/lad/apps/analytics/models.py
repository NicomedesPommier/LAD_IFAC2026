from django.conf import settings
from django.db import models
from django.utils import timezone


class Event(models.Model):
    """Universal append-only analytics event.

    Every client beacon, server request, beta mission start/complete, etc. is one
    row. A denormalized `date` column makes everything filter/GROUP BY by day —
    including free date filtering in the Django admin. Adding a new metric later =
    emit a new `event_type` string; no migration needed.
    """

    class Source(models.TextChoices):
        CLIENT = "client", "client"
        SERVER = "server", "server"
        WS = "ws", "ws"
        SYSTEM = "system", "system"

    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    date = models.DateField(db_index=True)  # denormalized day → the filter column
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, db_index=True,
    )
    session_id = models.CharField(max_length=64, blank=True, db_index=True)
    source = models.CharField(max_length=8, choices=Source.choices, default=Source.CLIENT)
    event_type = models.CharField(max_length=64, db_index=True)
    target = models.CharField(max_length=200, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    value = models.FloatField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["date", "event_type"]),
            models.Index(fields=["user", "date"]),
            models.Index(fields=["event_type", "created_at"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.date:
            self.date = (self.created_at or timezone.now()).date()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} {self.event_type} {self.target}".strip()


class Presence(models.Model):
    """Last-seen heartbeat per user → drives 'online now'."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True,
    )
    last_seen = models.DateTimeField(db_index=True)
    last_path = models.CharField(max_length=200, blank=True)
    active_ws = models.IntegerField(default=0)
    session_id = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.user} @ {self.last_seen}"
