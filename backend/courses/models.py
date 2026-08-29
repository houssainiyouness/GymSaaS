from django.core.exceptions import (
    ValidationError,
)
from django.db import models


class Coach(models.Model):
    first_name = models.CharField(
        max_length=100,
    )

    last_name = models.CharField(
        max_length=100,
    )

    photo = models.ImageField(
        upload_to="coaches/",
        blank=True,
        null=True,
    )

    specialty = models.CharField(
        max_length=150,
        blank=True,
    )

    email = models.EmailField(
        blank=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    bio = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    @property
    def full_name(self):
        return (
            f"{self.first_name} "
            f"{self.last_name}"
        ).strip()

    def __str__(self):
        return self.full_name

class Course(models.Model):
    name = models.CharField(
        max_length=150,
    )

    coach = models.ForeignKey(
        Coach,
        on_delete=models.PROTECT,
        related_name="courses",
    )

    description = models.TextField(
        blank=True,
    )

    room = models.CharField(
        max_length=100,
        blank=True,
    )

    start_at = models.DateTimeField()

    end_at = models.DateTimeField()

    capacity = models.PositiveIntegerField(
        default=10,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = (
            "start_at",
        )

    def clean(self):
        if (
            self.start_at
            and self.end_at
            and self.end_at
            <= self.start_at
        ):
            raise ValidationError(
                {
                    "end_at": (
                        "L'heure de fin doit être "
                        "postérieure à l'heure "
                        "de début."
                    )
                }
            )

        if self.capacity < 1:
            raise ValidationError(
                {
                    "capacity": (
                        "La capacité doit être "
                        "supérieure à zéro."
                    )
                }
            )

    def save(
        self,
        *args,
        **kwargs,
    ):
        self.full_clean()

        return super().save(
            *args,
            **kwargs,
        )

    def __str__(self):
        return self.name