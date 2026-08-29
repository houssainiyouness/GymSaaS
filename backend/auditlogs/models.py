from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = (
            "CREATE",
            "Création",
        )
        UPDATE = (
            "UPDATE",
            "Modification",
        )
        DELETE = (
            "DELETE",
            "Suppression",
        )
        ACTIVATE = (
            "ACTIVATE",
            "Activation",
        )
        DEACTIVATE = (
            "DEACTIVATE",
            "Désactivation",
        )
        SUSPEND = (
            "SUSPEND",
            "Suspension",
        )
        PAYMENT = (
            "PAYMENT",
            "Paiement",
        )
        CHECK_IN = (
            "CHECK_IN",
            "Entrée",
        )
        CHECK_OUT = (
            "CHECK_OUT",
            "Sortie",
        )
        LOGIN = (
            "LOGIN",
            "Connexion",
        )
        LOGOUT = (
            "LOGOUT",
            "Déconnexion",
        )
        PASSWORD_CHANGE = (
            "PASSWORD_CHANGE",
            "Changement du mot de passe",
        )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        blank=True,
        null=True,
        verbose_name="Utilisateur responsable",
    )
    action = models.CharField(
        max_length=30,
        choices=Action.choices,
        verbose_name="Action",
    )
    entity_type = models.CharField(
        max_length=100,
        verbose_name="Type d’objet",
    )
    entity_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Identifiant de l’objet",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Description",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Données complémentaires",
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="Adresse IP",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date et heure",
    )

    class Meta:
        verbose_name = "Journal d’audit"
        verbose_name_plural = "Journaux d’audit"
        ordering = ("-created_at",)
        indexes = (
            models.Index(
                fields=(
                    "created_at",
                ),
                name="audit_created_idx",
            ),
            models.Index(
                fields=(
                    "action",
                    "entity_type",
                ),
                name="audit_action_entity_idx",
            ),
        )

    def __str__(self):
        actor_name = (
            str(self.actor)
            if self.actor
            else "Système"
        )

        return (
            f"{actor_name} - "
            f"{self.get_action_display()} - "
            f"{self.entity_type}"
        )