import uuid
from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Member(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_profile",
        verbose_name="Compte utilisateur",
    )
    qr_code = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de naissance",
    )
    address = models.TextField(
        blank=True,
        verbose_name="Adresse",
    )
    emergency_phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Téléphone d’urgence",
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d’inscription",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif",
    )

    class Meta:
        verbose_name = "Adhérent"
        verbose_name_plural = "Adhérents"

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class MembershipPlan(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name="Nom",
    )
    duration_days = models.PositiveIntegerField(
        verbose_name="Durée en jours",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Prix",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Description",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active",
    )

    class Meta:
        verbose_name = "Formule d’abonnement"
        verbose_name_plural = "Formules d’abonnement"

    def __str__(self):
        return self.name


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        EXPIRING_SOON = "EXPIRING_SOON", "Bientôt expiré"
        EXPIRED = "EXPIRED", "Expiré"
        SUSPENDED = "SUSPENDED", "Suspendu"

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name="Adhérent",
    )
    plan = models.ForeignKey(
        MembershipPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
        verbose_name="Formule",
    )
    price_at_subscription = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False,
        verbose_name="Prix à la souscription",
    )
    start_date = models.DateField(
        default=timezone.localdate,
        verbose_name="Date de début",
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date d’expiration",
    )
    is_suspended = models.BooleanField(
        default=False,
        verbose_name="Suspendu",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
    )

    class Meta:
        verbose_name = "Abonnement"
        verbose_name_plural = "Abonnements"
        ordering = ("-start_date",)

    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError(
                {
                    "end_date": (
                        "La date d’expiration doit être égale "
                        "ou postérieure à la date de début."
                    )
                }
            )

    def save(self, *args, **kwargs):
        if (
            self._state.adding
            and self.plan_id
            and self.price_at_subscription is None
        ):
            self.price_at_subscription = self.plan.price

        if not self.end_date and self.plan_id:
            self.end_date = self.start_date + timedelta(
                days=self.plan.duration_days
            )

        self.full_clean()
        return super().save(*args, **kwargs)

    @property
    def days_remaining(self):
        if not self.end_date:
            return 0

        return max(
            (self.end_date - timezone.localdate()).days,
            0,
        )

    @property
    def status(self):
        today = timezone.localdate()

        if self.is_suspended:
            return self.Status.SUSPENDED

        if not self.end_date or self.end_date < today:
            return self.Status.EXPIRED

        if self.days_remaining <= 7:
            return self.Status.EXPIRING_SOON

        return self.Status.ACTIVE

    def get_status_display(self):
        return dict(self.Status.choices).get(
            self.status,
            self.status,
        )

    def __str__(self):
        return f"{self.member} - {self.plan}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "CASH", "Espèces"
        CARD = "CARD", "Carte"
        TRANSFER = "TRANSFER", "Virement"

    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Abonnement",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant",
    )
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.CASH,
        verbose_name="Mode de paiement",
    )
    paid_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Date du paiement",
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Référence",
    )
    notes = models.TextField(
        blank=True,
        verbose_name="Notes",
    )

    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ("-paid_at",)

    def __str__(self):
        return f"{self.subscription.member} - {self.amount}"
