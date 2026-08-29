from rest_framework import (
    filters,
    viewsets,
)

from members.permissions import (
    IsSuperAdminOrCoordinator,
)

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(
    viewsets.ReadOnlyModelViewSet,
):
    queryset = AuditLog.objects.select_related(
        "actor",
    ).all()
    serializer_class = AuditLogSerializer
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    search_fields = (
        "actor__username",
        "actor__first_name",
        "actor__last_name",
        "action",
        "entity_type",
        "entity_id",
        "description",
        "ip_address",
    )
    ordering_fields = (
        "created_at",
        "action",
        "entity_type",
    )
    ordering = (
        "-created_at",
    )
    http_method_names = (
        "get",
        "head",
        "options",
    )