from decimal import Decimal

from django.db.models import (
    Count,
    Sum,
)
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from members.models import (
    Payment,
    Subscription,
)
from members.permissions import IsSuperAdminOrCoordinator


class FinancialReportView(APIView):
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    def get(self, request):
        today = timezone.localdate()
        default_start_date = today.replace(day=1)

        start_date_value = request.query_params.get(
            "start_date",
        )
        end_date_value = request.query_params.get(
            "end_date",
        )

        start_date = self.parse_report_date(
            start_date_value,
            "start_date",
            default_start_date,
        )
        end_date = self.parse_report_date(
            end_date_value,
            "end_date",
            today,
        )

        if start_date > end_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "La date de fin doit être égale "
                        "ou postérieure à la date de début."
                    ),
                }
            )

        payments = Payment.objects.select_related(
            "subscription__member__user",
            "subscription__plan",
        ).filter(
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date,
        )

        revenue_summary = payments.aggregate(
            total_revenue=Sum("amount"),
            payment_count=Count("id"),
        )

        total_revenue = (
            revenue_summary["total_revenue"]
            or Decimal("0.00")
        )
        payment_count = (
            revenue_summary["payment_count"]
            or 0
        )

        average_payment = (
            total_revenue / payment_count
            if payment_count
            else Decimal("0.00")
        )

        payments_by_method = (
            payments.values("method")
            .annotate(
                total=Sum("amount"),
                count=Count("id"),
            )
            .order_by("method")
        )

        daily_revenue = (
            payments.annotate(
                date=TruncDate("paid_at"),
            )
            .values("date")
            .annotate(
                total=Sum("amount"),
                count=Count("id"),
            )
            .order_by("date")
        )

        subscriptions = (
            Subscription.objects.select_related(
                "member__user",
                "plan",
            )
            .prefetch_related("payments")
        )

        outstanding_subscriptions = []
        total_remaining = Decimal("0.00")

        for subscription in subscriptions:
            total_paid = sum(
                (
                    payment.amount
                    for payment in subscription.payments.all()
                ),
                Decimal("0.00"),
            )

            remaining_amount = max(
                (
                    subscription.price_at_subscription
                    - total_paid
                ),
                Decimal("0.00"),
            )

            if remaining_amount > Decimal("0.00"):
                total_remaining += remaining_amount

                outstanding_subscriptions.append(
                    {
                        "subscription_id": (
                            subscription.id
                        ),
                        "member_id": (
                            subscription.member_id
                        ),
                        "member_name": (
                            subscription.member.user.get_full_name()
                            or subscription.member.user.username
                        ),
                        "plan_name": (
                            subscription.plan.name
                        ),
                        "plan_price": (
                            subscription.price_at_subscription
                        ),
                        "total_paid": total_paid,
                        "remaining_amount": (
                            remaining_amount
                        ),
                        "end_date": (
                            subscription.end_date
                        ),
                    }
                )

        return Response(
            {
                "period": {
                    "start_date": start_date,
                    "end_date": end_date,
                },
                "revenue": {
                    "total": total_revenue,
                    "payment_count": payment_count,
                    "average_payment": (
                        average_payment.quantize(
                            Decimal("0.01"),
                        )
                    ),
                },
                "payments_by_method": list(
                    payments_by_method,
                ),
                "daily_revenue": list(
                    daily_revenue,
                ),
                "outstanding": {
                    "subscription_count": len(
                        outstanding_subscriptions,
                    ),
                    "total_remaining": (
                        total_remaining
                    ),
                    "subscriptions": (
                        outstanding_subscriptions
                    ),
                },
                "generated_at": timezone.now(),
            },
            status=status.HTTP_200_OK,
        )

    def parse_report_date(
        self,
        value,
        field_name,
        default_value,
    ):
        if not value:
            return default_value

        parsed_date = parse_date(value)

        if parsed_date is None:
            raise serializers.ValidationError(
                {
                    field_name: (
                        "La date doit utiliser le format "
                        "AAAA-MM-JJ."
                    ),
                }
            )

        return parsed_date
