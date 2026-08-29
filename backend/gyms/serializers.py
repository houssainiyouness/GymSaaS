from rest_framework import serializers

from .models import Gym


class GymSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Gym
        fields = (
            "id",
            "name",
            "logo",
            "logo_url",
            "primary_color",
            "secondary_color",
            "email",
            "phone",
            "address",
            "city",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "logo_url",
            "created_at",
            "updated_at",
        )

    def get_logo_url(self, obj):
        if not obj.logo:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                obj.logo.url
            )

        return obj.logo.url