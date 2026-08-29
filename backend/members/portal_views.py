from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from attendances.models import Attendance
from attendances.serializers import AttendanceSerializer

from .models import Member, Payment, Subscription
from .serializers import (
    PaymentSerializer,
    SubscriptionSerializer,
)


def get_authenticated_member(request):
    return get_object_or_404(
        Member.objects.select_related("user"),
        user=request.user,
    )


class MemberSubscriptionView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get(self, request):
        member = get_authenticated_member(request)
        today = timezone.localdate()

        subscription = (
            Subscription.objects.select_related(
                "member__user",
                "plan",
            )
            .filter(
                member=member,
                start_date__lte=today,
                end_date__gte=today,
                is_suspended=False,
            )
            .order_by("-end_date")
            .first()
        )

        if subscription is None:
            return Response(
                {
                    "subscription": None,
                }
            )

        serializer = SubscriptionSerializer(
            subscription,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "subscription": serializer.data,
            }
        )


class MemberPaymentsView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get(self, request):
        member = get_authenticated_member(request)

        payments = Payment.objects.select_related(
            "subscription__member__user",
            "subscription__plan",
        ).filter(
            subscription__member=member,
        ).order_by("-paid_at")

        serializer = PaymentSerializer(
            payments,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "payments": serializer.data,
            }
        )


class MemberAttendancesView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get(self, request):
        member = get_authenticated_member(request)

        attendances = Attendance.objects.select_related(
            "member__user",
            "recorded_by",
        ).filter(
            member=member,
        ).order_by("-check_in")

        serializer = AttendanceSerializer(
            attendances,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "attendances": serializer.data,
            }
        )


class MemberQRCodeView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get(self, request):
        member = get_authenticated_member(request)

        return Response(
            {
                "member_id": member.id,
                "qr_code": member.qr_code,
            }
        )