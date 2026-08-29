from django.conf import settings
from django.db import models

from members.models import Member


class Attendance(models.Model):
    class EntryMethod(models.TextChoices):
        MANUAL = "manual", "Manuel"
        QR_CODE = "qr_code", "QR code"

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    check_in = models.DateTimeField(
        auto_now_add=True,
    )
    check_out = models.DateTimeField(
        blank=True,
        null=True,
    )
    entry_method = models.CharField(
        max_length=20,
        choices=EntryMethod.choices,
        default=EntryMethod.MANUAL,
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="recorded_attendances",
    )
    notes = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ("-check_in",)

    def __str__(self):
        return f"{self.member} - {self.check_in}"