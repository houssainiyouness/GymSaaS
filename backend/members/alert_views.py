from datetime import timedelta
from decimal import Decimal

from django.db.models import (
    DecimalField,
    ExpressionWrapper,
    F,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Member,
    Subscription,
)
from .permissions import IsSuperAdminOrCoordinator
from .serializers import (
    MemberSerializer,
    SubscriptionSerializer,
)


class SubscriptionAlertsView(APIView):
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    def get(self, request):
        today = timezone.localdate()

        days_value = request.query_params.get(
            "days",
            "7",
        )

        try:
            days = int(days_value)
        except ValueError as error:
            raise serializers.ValidationError(
                {
                    "days": (
                        "Le nombre de jours doit être "
                        "un entier."
                    ),
                }
            ) from error

        if days not in (7, 15, 30):
            raise serializers.ValidationError(
                {
                    "days": (
                        "La période doit être de "
                        "7, 15 ou 30 jours."
                    ),
                }
            )

        expiration_limit = today + timedelta(
            days=days,
        )

        subscriptions = Subscription.objects.select_related(
            "member__user",
            "plan",
        )

        expiring_soon = subscriptions.filter(
            start_date__lte=today,
            end_date__gte=today,
            end_date__lte=expiration_limit,
            is_suspended=False,
        ).order_by("end_date")

        expired = subscriptions.filter(
            end_date__lt=today,
            is_suspended=False,
        ).order_by("-end_date")

        suspended = subscriptions.filter(
            is_suspended=True,
        ).order_by("-end_date")

        members_without_active_subscription = (
            Member.objects.select_related("user")
            .filter(
                is_active=True,
            )
            .exclude(
                subscriptions__start_date__lte=today,
                subscriptions__end_date__gte=today,
                subscriptions__is_suspended=False,
            )
            .distinct()
            .order_by("user__username")
        )

        data = {
            "period_days": days,
            "generated_at": timezone.now(),
            "counts": {
                "expiring_soon": expiring_soon.count(),
                "expired": expired.count(),
                "suspended": suspended.count(),
                "members_without_active_subscription": (
                    members_without_active_subscription.count()
                ),
            },
            "expiring_soon": SubscriptionSerializer(
                expiring_soon,
                many=True,
                context={
                    "request": request,
                },
            ).data,
            "expired": SubscriptionSerializer(
                expired,
                many=True,
                context={
                    "request": request,
                },
            ).data,
            "suspended": SubscriptionSerializer(
                suspended,
                many=True,
                context={
                    "request": request,
                },
            ).data,
            "members_without_active_subscription": (
                MemberSerializer(
                    members_without_active_subscription,
                    many=True,
                    context={
                        "request": request,
                    },
                ).data
            ),
        }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )


class PaymentAlertsView(APIView):
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    def get(self, request):
        money_field = DecimalField(
            max_digits=10,
            decimal_places=2,
        )

        subscriptions = (
            Subscription.objects.select_related(
                "member__user",
                "plan",
            )
            .annotate(
                total_paid=Coalesce(
                    Sum("payments__amount"),
                    Value(
                        Decimal("0.00"),
                        output_field=money_field,
                    ),
                    output_field=money_field,
                ),
            )
            .annotate(
                remaining_amount=ExpressionWrapper(
                    (
                        F("price_at_subscription")
                        - F("total_paid")
                    ),
                    output_field=money_field,
                ),
            )
            .filter(
                remaining_amount__gt=Decimal("0.00"),
            )
            .order_by(
                "-remaining_amount",
            )
        )

        alerts = []

        for subscription in subscriptions:
            alerts.append(
                {
                    "subscription_id": subscription.id,
                    "member_id": subscription.member_id,
                    "member_name": (
                        subscription.member.user.get_full_name()
                        or subscription.member.user.username
                    ),
                    "plan_id": subscription.plan_id,
                    "plan_name": subscription.plan.name,
                    "plan_price": (
                        subscription.price_at_subscription
                    ),
                    "total_paid": subscription.total_paid,
                    "remaining_amount": (
                        subscription.remaining_amount
                    ),
                    "end_date": subscription.end_date,
                    "is_suspended": (
                        subscription.is_suspended
                    ),
                }
            )

        total_remaining = sum(
            (
                alert["remaining_amount"]
                for alert in alerts
            ),
            Decimal("0.00"),
        )

        return Response(
            {
                "generated_at": timezone.now(),
                "count": len(alerts),
                "total_remaining": total_remaining,
                "alerts": alerts,
            },
            status=status.HTTP_200_OK,
        )
