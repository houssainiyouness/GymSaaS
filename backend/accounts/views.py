from django.contrib.auth import authenticate
from rest_framework import (
    permissions,
    serializers,
    status,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken

from auditlogs.models import AuditLog
from auditlogs.services import create_audit_log
from members.serializers import MemberSerializer

from .password_serializers import (
    ChangePasswordSerializer,
)
from .serializers import (
    RegistrationSerializer,
    UserSerializer,
)


def create_token_pair(user):
    refresh = RefreshToken.for_user(user)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def blacklist_user_tokens(user):
    outstanding_tokens = OutstandingToken.objects.filter(
        user=user,
    )

    for outstanding_token in outstanding_tokens:
        BlacklistedToken.objects.get_or_create(
            token=outstanding_token,
        )


class RegisterView(APIView):
    permission_classes = (
        permissions.AllowAny,
    )

    def post(self, request):
        serializer = RegistrationSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        user = serializer.save()
        tokens = create_token_pair(user)

        member = user.member_profile

        create_audit_log(
            request=request,
            actor=user,
            action=AuditLog.Action.CREATE,
            entity=user,
            description=(
                "Inscription publique d’un membre."
            ),
            metadata={
                "member_id": member.id,
                "username": user.username,
                "email": user.email,
            },
        )

        return Response(
            {
                **tokens,
                "user": UserSerializer(
                    user,
                ).data,
                "member": MemberSerializer(
                    member,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = (
        permissions.AllowAny,
    )

    def post(self, request):
        username = request.data.get(
            "username",
        )
        password = request.data.get(
            "password",
        )

        if not username or not password:
            return Response(
                {
                    "detail": (
                        "Le nom d’utilisateur et le mot "
                        "de passe sont obligatoires."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {
                    "detail": (
                        "Identifiants incorrects."
                    ),
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    "detail": (
                        "Ce compte est désactivé."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = create_token_pair(user)

        create_audit_log(
            request=request,
            actor=user,
            action=AuditLog.Action.LOGIN,
            entity=user,
            description="Connexion réussie.",
            metadata={
                "username": user.username,
                "role": user.role,
            },
        )

        return Response(
            {
                **tokens,
                "user": UserSerializer(
                    user,
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def post(self, request):
        refresh_value = request.data.get(
            "refresh",
        )

        if not refresh_value:
            raise serializers.ValidationError(
                {
                    "refresh": (
                        "Le refresh token est obligatoire."
                    ),
                }
            )

        try:
            refresh = RefreshToken(
                refresh_value,
            )

            if str(refresh["user_id"]) != str(
                request.user.pk,
            ):
                raise serializers.ValidationError(
                    {
                        "refresh": (
                            "Ce refresh token ne correspond "
                            "pas à l’utilisateur connecté."
                        ),
                    }
                )

            refresh.blacklist()
        except TokenError as error:
            raise serializers.ValidationError(
                {
                    "refresh": (
                        "Le refresh token est invalide "
                        "ou expiré."
                    ),
                }
            ) from error

        create_audit_log(
            request=request,
            action=AuditLog.Action.LOGOUT,
            entity=request.user,
            description="Déconnexion réussie.",
            metadata={
                "username": request.user.username,
            },
        )

        return Response(
            {
                "detail": (
                    "Déconnexion réussie."
                ),
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get(self, request):
        return Response(
            UserSerializer(
                request.user,
            ).data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )
        serializer.is_valid(
            raise_exception=True,
        )

        user = serializer.save()

        blacklist_user_tokens(user)
        tokens = create_token_pair(user)

        create_audit_log(
            request=request,
            actor=user,
            action=(
                AuditLog.Action.PASSWORD_CHANGE
            ),
            entity=user,
            description=(
                "Changement du mot de passe."
            ),
            metadata={
                "username": user.username,
            },
        )

        return Response(
            {
                "detail": (
                    "Mot de passe modifié avec succès."
                ),
                **tokens,
            },
            status=status.HTTP_200_OK,
        )
