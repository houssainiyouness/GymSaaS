from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(
    serializers.ModelSerializer,
):
    actor_username = serializers.CharField(
        source="actor.username",
        read_only=True,
        allow_null=True,
    )
    actor_full_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(
        source="get_action_display",
        read_only=True,
    )

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "actor",
            "actor_username",
            "actor_full_name",
            "action",
            "action_display",
            "entity_type",
            "entity_id",
            "description",
            "metadata",
            "ip_address",
            "created_at",
        )
        read_only_fields = fields

    def get_actor_full_name(self, obj):
        if obj.actor is None:
            return None

        return (
            obj.actor.get_full_name()
            or obj.actor.username
        )