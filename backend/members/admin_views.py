from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import UserSerializer
from auditlogs.models import AuditLog
from auditlogs.services import create_audit_log

from .admin_serializers import (
    AdminMemberCreateSerializer,
)
from .permissions import IsSuperAdminOrCoordinator
from .serializers import MemberSerializer


class AdminMemberCreateView(APIView):
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    def post(self, request):
        serializer = AdminMemberCreateSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        member = serializer.save()

        create_audit_log(
            request=request,
            action=AuditLog.Action.CREATE,
            entity=member,
            description=(
                "Création d’un membre par "
                "l’administration."
            ),
            metadata={
                "user_id": member.user_id,
                "username": member.user.username,
                "email": member.user.email,
                "is_active": member.is_active,
            },
        )

        return Response(
            {
                "user": UserSerializer(
                    member.user,
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