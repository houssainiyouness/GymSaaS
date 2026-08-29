from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import serializers

from accounts.models import User

from .models import Member


class AdminMemberCreateSerializer(
    serializers.Serializer,
):
    username = serializers.CharField(
        max_length=150,
    )
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={
            "input_type": "password",
        },
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={
            "input_type": "password",
        },
    )
    first_name = serializers.CharField(
        max_length=150,
    )
    last_name = serializers.CharField(
        max_length=150,
    )
    phone = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=20,
    )
    preferred_language = serializers.ChoiceField(
        choices=(
            ("fr", "Français"),
            ("ar", "Arabe"),
        ),
        default="fr",
    )
    birth_date = serializers.DateField(
        required=False,
        allow_null=True,
    )
    address = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    emergency_phone = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=20,
    )
    is_active = serializers.BooleanField(
        default=True,
    )

    def validate_username(self, value):
        value = value.strip()

        if User.objects.filter(
            username__iexact=value,
        ).exists():
            raise serializers.ValidationError(
                "Ce nom d’utilisateur est déjà utilisé."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value,
        ).exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get(
            "password_confirm",
        )

        if password != password_confirm:
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Les deux mots de passe "
                        "ne correspondent pas."
                    ),
                }
            )

        temporary_user = User(
            username=attrs.get("username", ""),
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )

        try:
            validate_password(
                password,
                user=temporary_user,
            )
        except ValidationError as error:
            raise serializers.ValidationError(
                {
                    "password": list(
                        error.messages,
                    ),
                }
            ) from error

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop(
            "password_confirm",
        )
        password = validated_data.pop(
            "password",
        )
        is_active = validated_data.pop(
            "is_active",
            True,
        )

        member_data = {
            "birth_date": validated_data.pop(
                "birth_date",
                None,
            ),
            "address": validated_data.pop(
                "address",
                "",
            ),
            "emergency_phone": validated_data.pop(
                "emergency_phone",
                "",
            ),
            "is_active": is_active,
        }

        user = User.objects.create_user(
            password=password,
            role=User.Role.MEMBER,
            is_active=is_active,
            **validated_data,
        )

        member = Member.objects.create(
            user=user,
            **member_data,
        )

        return member