from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import (
    filters,
    serializers,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from auditlogs.models import AuditLog
from auditlogs.services import create_audit_log
from members.models import Member
from members.permissions import IsSuperAdminOrCoordinator

from .models import Attendance
from .serializers import (
    AttendanceSerializer,
    QRCodeCheckInSerializer,
)


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )
    http_method_names = (
        "get",
        "post",
        "patch",
        "head",
        "options",
    )
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    search_fields = (
        "member__user__username",
        "member__user__first_name",
        "member__user__last_name",
        "member__user__email",
    )
    ordering_fields = (
        "check_in",
        "check_out",
    )
    ordering = ("-check_in",)

    def get_queryset(self):
        queryset = Attendance.objects.select_related(
            "member__user",
            "recorded_by",
        ).all()

        member_id = self.request.query_params.get(
            "member",
        )
        date_from_value = self.request.query_params.get(
            "date_from",
        )
        date_to_value = self.request.query_params.get(
            "date_to",
        )
        attendance_status = (
            self.request.query_params.get(
                "status",
            )
        )

        if member_id:
            queryset = queryset.filter(
                member_id=member_id,
            )

        if date_from_value:
            date_from = parse_date(
                date_from_value,
            )

            if date_from is None:
                raise serializers.ValidationError(
                    {
                        "date_from": (
                            "La date doit utiliser le "
                            "format AAAA-MM-JJ."
                        ),
                    }
                )

            queryset = queryset.filter(
                check_in__date__gte=date_from,
            )

        if date_to_value:
            date_to = parse_date(
                date_to_value,
            )

            if date_to is None:
                raise serializers.ValidationError(
                    {
                        "date_to": (
                            "La date doit utiliser le "
                            "format AAAA-MM-JJ."
                        ),
                    }
                )

            queryset = queryset.filter(
                check_in__date__lte=date_to,
            )

        if attendance_status == "present":
            queryset = queryset.filter(
                check_out__isnull=True,
            )
        elif attendance_status == "checked_out":
            queryset = queryset.filter(
                check_out__isnull=False,
            )
        elif attendance_status:
            raise serializers.ValidationError(
                {
                    "status": (
                        "Le statut doit être "
                        "« present » ou "
                        "« checked_out »."
                    ),
                }
            )

        return queryset

    def perform_create(self, serializer):
        attendance = serializer.save(
            recorded_by=self.request.user,
        )

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.CHECK_IN,
            entity=attendance,
            description=(
                "Enregistrement manuel d’une entrée."
            ),
            metadata={
                "member_id": attendance.member_id,
                "member_name": str(
                    attendance.member,
                ),
                "entry_method": (
                    attendance.entry_method
                ),
                "check_in": attendance.check_in,
            },
        )

    def perform_update(self, serializer):
        previous_check_out = (
            serializer.instance.check_out
        )
        attendance = serializer.save()

        action_value = AuditLog.Action.UPDATE
        description = (
            "Modification d’une présence."
        )

        if (
            previous_check_out is None
            and attendance.check_out is not None
        ):
            action_value = AuditLog.Action.CHECK_OUT
            description = (
                "Enregistrement d’une sortie."
            )

        create_audit_log(
            request=self.request,
            action=action_value,
            entity=attendance,
            description=description,
            metadata={
                "member_id": attendance.member_id,
                "check_in": attendance.check_in,
                "check_out": attendance.check_out,
                "entry_method": (
                    attendance.entry_method
                ),
            },
        )

    @action(
        detail=False,
        methods=("get",),
        url_path="currently-present",
    )
    def currently_present(self, request):
        attendances = self.get_queryset().filter(
            check_out__isnull=True,
        )

        serializer = self.get_serializer(
            attendances,
            many=True,
        )

        return Response(
            {
                "count": attendances.count(),
                "attendances": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=("get",),
        url_path="summary",
    )
    def summary(self, request):
        today = timezone.localdate()
        month_start = today.replace(
            day=1,
        )

        today_attendances = Attendance.objects.filter(
            check_in__date=today,
        )
        month_attendances = Attendance.objects.filter(
            check_in__date__gte=month_start,
            check_in__date__lte=today,
        )

        completed_today = today_attendances.filter(
            check_out__isnull=False,
        )

        durations = []

        for attendance in completed_today:
            duration = (
                attendance.check_out
                - attendance.check_in
            )

            durations.append(
                max(
                    duration.total_seconds() / 60,
                    0,
                )
            )

        average_duration = (
            round(
                sum(durations) / len(durations),
                2,
            )
            if durations
            else 0
        )

        data = {
            "today": {
                "total_check_ins": (
                    today_attendances.count()
                ),
                "currently_present": (
                    today_attendances.filter(
                        check_out__isnull=True,
                    ).count()
                ),
                "checked_out": (
                    completed_today.count()
                ),
                "unique_members": (
                    today_attendances.values(
                        "member_id",
                    ).distinct().count()
                ),
                "average_duration_minutes": (
                    average_duration
                ),
            },
            "current_month": {
                "total_check_ins": (
                    month_attendances.count()
                ),
                "unique_members": (
                    month_attendances.values(
                        "member_id",
                    ).distinct().count()
                ),
            },
        }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=("post",),
        url_path="qr-checkin",
    )
    def qr_checkin(self, request):
        qr_serializer = QRCodeCheckInSerializer(
            data=request.data,
        )
        qr_serializer.is_valid(
            raise_exception=True,
        )

        qr_code = qr_serializer.validated_data[
            "qr_code"
        ]

        try:
            member = Member.objects.get(
                qr_code=qr_code,
            )
        except Member.DoesNotExist:
            return Response(
                {
                    "qr_code": (
                        "Ce QR code ne correspond "
                        "à aucun membre."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        attendance_serializer = AttendanceSerializer(
            data={
                "member": member.id,
                "entry_method": (
                    Attendance.EntryMethod.QR_CODE
                ),
            },
            context=self.get_serializer_context(),
        )
        attendance_serializer.is_valid(
            raise_exception=True,
        )

        attendance = attendance_serializer.save(
            recorded_by=request.user,
        )

        create_audit_log(
            request=request,
            action=AuditLog.Action.CHECK_IN,
            entity=attendance,
            description=(
                "Enregistrement d’une entrée "
                "par QR code."
            ),
            metadata={
                "member_id": member.id,
                "member_name": str(member),
                "entry_method": (
                    Attendance.EntryMethod.QR_CODE
                ),
                "check_in": attendance.check_in,
            },
        )

        return Response(
            AttendanceSerializer(
                attendance,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=("post",),
        url_path="checkout",
    )
    def checkout(self, request, pk=None):
        attendance = self.get_object()

        if attendance.check_out is not None:
            return Response(
                {
                    "detail": (
                        "La sortie de cette présence "
                        "est déjà enregistrée."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        attendance.check_out = timezone.now()
        attendance.save(
            update_fields=(
                "check_out",
            ),
        )

        create_audit_log(
            request=request,
            action=AuditLog.Action.CHECK_OUT,
            entity=attendance,
            description=(
                "Enregistrement d’une sortie."
            ),
            metadata={
                "member_id": attendance.member_id,
                "member_name": str(
                    attendance.member,
                ),
                "check_in": attendance.check_in,
                "check_out": attendance.check_out,
            },
        )

        return Response(
            self.get_serializer(
                attendance,
            ).data,
            status=status.HTTP_200_OK,
        )