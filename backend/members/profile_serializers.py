from django.db import transaction
from rest_framework import serializers

from accounts.models import User

from .models import Member


class MemberProfileUpdateSerializer(
    serializers.ModelSerializer,
):
    first_name = serializers.CharField(
        source="user.first_name",
        required=False,
        allow_blank=True,
        max_length=150,
    )
    last_name = serializers.CharField(
        source="user.last_name",
        required=False,
        allow_blank=True,
        max_length=150,
    )
    email = serializers.EmailField(
        source="user.email",
        required=False,
    )
    phone = serializers.CharField(
        source="user.phone",
        required=False,
        allow_blank=True,
        max_length=20,
    )
    preferred_language = serializers.ChoiceField(
        source="user.preferred_language",
        choices=(
            ("fr", "Français"),
            ("ar", "Arabe"),
        ),
        required=False,
    )

    class Meta:
        model = Member
        fields = (
            "first_name",
            "last_name",
            "email",
            "phone",
            "preferred_language",
            "birth_date",
            "address",
            "emergency_phone",
        )
        extra_kwargs = {
            "birth_date": {
                "required": False,
                "allow_null": True,
            },
            "address": {
                "required": False,
                "allow_blank": True,
            },
            "emergency_phone": {
                "required": False,
                "allow_blank": True,
            },
        }

    def validate_email(self, value):
        value = value.strip().lower()

        existing_users = User.objects.filter(
            email__iexact=value,
        )

        if self.instance:
            existing_users = existing_users.exclude(
                pk=self.instance.user_id,
            )

        if existing_users.exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop(
            "user",
            {},
        )

        user = instance.user

        for field_name, value in user_data.items():
            setattr(
                user,
                field_name,
                value,
            )

        if user_data:
            user.save(
                update_fields=list(
                    user_data.keys(),
                ),
            )

        for field_name, value in (
            validated_data.items()
        ):
            setattr(
                instance,
                field_name,
                value,
            )

        if validated_data:
            instance.save(
                update_fields=list(
                    validated_data.keys(),
                ),
            )

        return instance