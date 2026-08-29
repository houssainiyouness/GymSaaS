from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import serializers

from members.models import Member

from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "preferred_language",
        )
        read_only_fields = fields

    def get_full_name(self, obj):
        return (
            obj.get_full_name()
            or obj.username
        )


class RegistrationSerializer(
    serializers.ModelSerializer,
):
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

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone",
            "preferred_language",
            "birth_date",
            "address",
            "emergency_phone",
        )
        extra_kwargs = {
            "email": {
                "required": True,
                "allow_blank": False,
            },
            "first_name": {
                "required": True,
                "allow_blank": False,
            },
            "last_name": {
                "required": True,
                "allow_blank": False,
            },
        }

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
        }

        user = User.objects.create_user(
            password=password,
            role=User.Role.MEMBER,
            **validated_data,
        )

        Member.objects.create(
            user=user,
            **member_data,
        )

        return user