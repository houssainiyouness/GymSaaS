from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import ValidationError
from rest_framework import serializers


class ChangePasswordSerializer(
    serializers.Serializer,
):
    old_password = serializers.CharField(
        write_only=True,
        style={
            "input_type": "password",
        },
    )
    new_password = serializers.CharField(
        write_only=True,
        style={
            "input_type": "password",
        },
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={
            "input_type": "password",
        },
    )

    def validate_old_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "L’ancien mot de passe est incorrect."
            )

        return value

    def validate(self, attrs):
        new_password = attrs.get(
            "new_password",
        )
        new_password_confirm = attrs.get(
            "new_password_confirm",
        )

        if new_password != new_password_confirm:
            raise serializers.ValidationError(
                {
                    "new_password_confirm": (
                        "Les deux nouveaux mots de passe "
                        "ne correspondent pas."
                    ),
                }
            )

        user = self.context["request"].user

        if user.check_password(new_password):
            raise serializers.ValidationError(
                {
                    "new_password": (
                        "Le nouveau mot de passe doit être "
                        "différent de l’ancien."
                    ),
                }
            )

        try:
            validate_password(
                new_password,
                user=user,
            )
        except ValidationError as error:
            raise serializers.ValidationError(
                {
                    "new_password": list(
                        error.messages,
                    ),
                }
            ) from error

        return attrs

    def save(self):
        user = self.context["request"].user

        user.set_password(
            self.validated_data["new_password"],
        )
        user.save(
            update_fields=(
                "password",
            ),
        )

        return user