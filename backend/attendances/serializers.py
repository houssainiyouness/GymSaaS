from django.utils import timezone
from rest_framework import serializers

from members.models import Subscription

from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.StringRelatedField(
        source="member",
        read_only=True,
    )
    recorded_by_username = serializers.CharField(
        source="recorded_by.username",
        read_only=True,
    )
    duration_minutes = serializers.SerializerMethodField()
    attendance_status = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = (
            "id",
            "member",
            "member_name",
            "check_in",
            "check_out",
            "duration_minutes",
            "attendance_status",
            "entry_method",
            "recorded_by",
            "recorded_by_username",
            "notes",
        )
        read_only_fields = (
            "id",
            "check_in",
            "duration_minutes",
            "attendance_status",
            "recorded_by",
        )

    def get_duration_minutes(self, obj):
        end_time = obj.check_out or timezone.now()
        duration = end_time - obj.check_in

        return max(
            int(duration.total_seconds() // 60),
            0,
        )

    def get_attendance_status(self, obj):
        if obj.check_out is None:
            return "present"

        return "checked_out"

    def validate(self, attrs):
        if self.instance is None:
            member = attrs.get("member")
            today = timezone.localdate()

            if not member.is_active:
                raise serializers.ValidationError(
                    {
                        "member": (
                            "Ce membre est inactif."
                        ),
                    }
                )

            has_active_subscription = (
                Subscription.objects.filter(
                    member=member,
                    start_date__lte=today,
                    end_date__gte=today,
                    is_suspended=False,
                ).exists()
            )

            if not has_active_subscription:
                raise serializers.ValidationError(
                    {
                        "member": (
                            "Ce membre ne possède pas "
                            "d’abonnement actif."
                        ),
                    }
                )

            already_inside = Attendance.objects.filter(
                member=member,
                check_out__isnull=True,
            ).exists()

            if already_inside:
                raise serializers.ValidationError(
                    {
                        "member": (
                            "Une entrée sans sortie existe "
                            "déjà pour ce membre."
                        ),
                    }
                )

            if attrs.get("check_out") is not None:
                raise serializers.ValidationError(
                    {
                        "check_out": (
                            "La sortie ne peut pas être "
                            "enregistrée lors de l’entrée."
                        ),
                    }
                )

        check_out = attrs.get("check_out")

        if (
            self.instance is not None
            and check_out is not None
            and check_out < self.instance.check_in
        ):
            raise serializers.ValidationError(
                {
                    "check_out": (
                        "L’heure de sortie doit être "
                        "postérieure à l’heure d’entrée."
                    ),
                }
            )

        return attrs


class QRCodeCheckInSerializer(serializers.Serializer):
    qr_code = serializers.UUIDField()