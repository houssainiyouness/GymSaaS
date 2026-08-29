from rest_framework import (
    filters,
    permissions,
    viewsets,
)

from members.permissions import (
    IsSuperAdminOrCoordinator,
)

from .models import (
    Coach,
    Course,
)

from .serializers import (
    CoachSerializer,
    CourseSerializer,
)


def is_manager(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.role
            in (
                "SUPER_ADMIN",
                "COORDINATOR",
            )
        )
    )


class CoachViewSet(
    viewsets.ModelViewSet,
):
    serializer_class = (
        CoachSerializer
    )

    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )

    search_fields = (
        "first_name",
        "last_name",
        "specialty",
        "email",
        "phone",
    )

    ordering_fields = (
        "first_name",
        "last_name",
        "specialty",
        "created_at",
    )

    ordering = (
        "first_name",
        "last_name",
    )

    def get_queryset(self):
        queryset = (
            Coach.objects.all()
        )

        # Admin et coordinateur :
        # voient tous les coachs.
        if is_manager(
            self.request.user
        ):
            return queryset

        # Accueil public :
        # seulement les coachs actifs.
        return queryset.filter(
            is_active=True,
        )

    def get_permissions(self):
        # GET public.
        if self.action in (
            "list",
            "retrieve",
        ):
            return [
                permissions.AllowAny(),
            ]

        # Ajout / modification /
        # suppression :
        # admin uniquement.
        return [
            IsSuperAdminOrCoordinator(),
        ]


class CourseViewSet(
    viewsets.ModelViewSet,
):
    serializer_class = (
        CourseSerializer
    )

    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )

    search_fields = (
        "name",
        "coach__first_name",
        "coach__last_name",
        "room",
        "description",
    )

    ordering_fields = (
        "name",
        "start_at",
        "end_at",
        "capacity",
    )

    ordering = (
        "start_at",
    )

    def get_queryset(self):
        return (
            Course.objects
            .select_related(
                "coach"
            )
            .all()
        )