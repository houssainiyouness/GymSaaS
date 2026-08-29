from rest_framework import serializers

from .models import (
    Coach,
    Course,
)


class CoachSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        read_only=True,
    )

    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Coach

        fields = (
            "id",
            "first_name",
            "last_name",
            "full_name",
            "photo",
            "photo_url",
            "specialty",
            "email",
            "phone",
            "bio",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "full_name",
            "photo_url",
            "created_at",
            "updated_at",
        )

    def get_photo_url(self, obj):
        if not obj.photo:
            return None

        request = self.context.get(
            "request",
        )

        if request:
            return request.build_absolute_uri(
                obj.photo.url,
            )

        return obj.photo.url


class CourseSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(
        source="coach.full_name",
        read_only=True,
    )

    class Meta:
        model = Course

        fields = (
            "id",
            "name",
            "coach",
            "coach_name",
            "description",
            "room",
            "start_at",
            "end_at",
            "capacity",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "coach_name",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        start_at = attrs.get(
            "start_at",
            getattr(
                self.instance,
                "start_at",
                None,
            ),
        )

        end_at = attrs.get(
            "end_at",
            getattr(
                self.instance,
                "end_at",
                None,
            ),
        )

        if (
            start_at
            and end_at
            and end_at <= start_at
        ):
            raise serializers.ValidationError(
                {
                    "end_at": (
                        "La fin doit être "
                        "postérieure au début."
                    )
                }
            )

        return attrs