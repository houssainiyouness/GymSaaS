from datetime import date, timedelta
from decimal import Decimal

from django.db.models import (
    Count,
    Sum,
)
from django.db.models.functions import (
    TruncDate,
    TruncMonth,
)
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from attendances.models import Attendance
from members.models import (
    Member,
    Payment,
    Subscription,
)
from members.permissions import (
    IsSuperAdminOrCoordinator,
)
from members.serializers import (
    PaymentSerializer,
)


def add_months(value, months):
    month_index = (
        value.year * 12
        + value.month
        - 1
        + months
    )

    year, month = divmod(
        month_index,
        12,
    )

    return date(
        year,
        month + 1,
        1,
    )


class DashboardSummaryView(APIView):
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    def get(self, request):
        today = timezone.localdate()

        month_start = today.replace(
            day=1,
        )

        previous_month_start = add_months(
            month_start,
            -1,
        )

        previous_month_end = (
            month_start
            - timedelta(days=1)
        )

        expiration_limit = (
            today
            + timedelta(days=7)
        )

        subscriptions = (
            Subscription.objects.all()
        )

        payments = Payment.objects.all()

        total_revenue = (
            payments.aggregate(
                total=Sum("amount"),
            )["total"]
            or Decimal("0.00")
        )

        monthly_revenue = (
            payments.filter(
                paid_at__date__gte=month_start,
                paid_at__date__lte=today,
            ).aggregate(
                total=Sum("amount"),
            )["total"]
            or Decimal("0.00")
        )

        previous_month_revenue = (
            payments.filter(
                paid_at__date__gte=(
                    previous_month_start
                ),
                paid_at__date__lte=(
                    previous_month_end
                ),
            ).aggregate(
                total=Sum("amount"),
            )["total"]
            or Decimal("0.00")
        )

        if previous_month_revenue > 0:
            revenue_growth = round(
                float(
                    (
                        monthly_revenue
                        - previous_month_revenue
                    )
                    / previous_month_revenue
                    * 100
                ),
                2,
            )
        elif monthly_revenue > 0:
            revenue_growth = 100.0
        else:
            revenue_growth = 0.0

        active_subscriptions = (
            subscriptions.filter(
                end_date__gte=today,
                is_suspended=False,
            ).count()
        )

        expiring_soon = (
            subscriptions.filter(
                end_date__gte=today,
                end_date__lte=(
                    expiration_limit
                ),
                is_suspended=False,
            ).count()
        )

        expired_subscriptions = (
            subscriptions.filter(
                end_date__lt=today,
                is_suspended=False,
            ).count()
        )

        suspended_subscriptions = (
            subscriptions.filter(
                is_suspended=True,
            ).count()
        )

        recent_payments = (
            payments.select_related(
                "subscription__member__user",
                "subscription__plan",
            )
            .order_by("-paid_at")[:5]
        )

        #
        # ANALYTIQUE 12 MOIS
        #

        first_month = add_months(
            month_start,
            -11,
        )

        revenue_query = (
            payments.filter(
                paid_at__date__gte=(
                    first_month
                )
            )
            .annotate(
                month=TruncMonth(
                    "paid_at"
                )
            )
            .values("month")
            .annotate(
                total=Sum("amount")
            )
            .order_by("month")
        )

        revenue_map = {}

        for item in revenue_query:
            value = item["month"]

            revenue_map[
                (
                    value.year,
                    value.month,
                )
            ] = item["total"]

        member_query = (
            Member.objects.filter(
                joined_at__date__gte=(
                    first_month
                )
            )
            .annotate(
                month=TruncMonth(
                    "joined_at"
                )
            )
            .values("month")
            .annotate(
                total=Count("id")
            )
            .order_by("month")
        )

        members_map = {}

        for item in member_query:
            value = item["month"]

            members_map[
                (
                    value.year,
                    value.month,
                )
            ] = item["total"]

        monthly_series = []

        for offset in range(12):
            current = add_months(
                first_month,
                offset,
            )

            key = (
                current.year,
                current.month,
            )

            monthly_series.append(
                {
                    "month": (
                        f"{current.year}-"
                        f"{current.month:02d}"
                    ),
                    "revenue": (
                        revenue_map.get(
                            key,
                            Decimal("0.00"),
                        )
                    ),
                    "new_members": (
                        members_map.get(
                            key,
                            0,
                        )
                    ),
                }
            )

        #
        # FRÉQUENTATION 7 JOURS
        #

        first_day = (
            today
            - timedelta(days=6)
        )

        attendance_query = (
            Attendance.objects.filter(
                check_in__date__gte=(
                    first_day
                ),
                check_in__date__lte=today,
            )
            .annotate(
                day=TruncDate(
                    "check_in"
                )
            )
            .values("day")
            .annotate(
                total=Count("id")
            )
            .order_by("day")
        )

        attendance_map = {
            item["day"]: item["total"]
            for item in attendance_query
        }

        attendance_series = []

        for offset in range(7):
            current = (
                first_day
                + timedelta(days=offset)
            )

            attendance_series.append(
                {
                    "date": current.isoformat(),
                    "count": (
                        attendance_map.get(
                            current,
                            0,
                        )
                    ),
                }
            )

        #
        # DISTRIBUTION FORMULES
        #

        plan_distribution = list(
            subscriptions.filter(
                end_date__gte=today,
                is_suspended=False,
            )
            .values(
                "plan__name",
            )
            .annotate(
                count=Count("id")
            )
            .order_by("-count")
        )

        data = {
            "members": {
                "total": (
                    Member.objects.count()
                ),
                "active": (
                    Member.objects.filter(
                        is_active=True,
                    ).count()
                ),
                "inactive": (
                    Member.objects.filter(
                        is_active=False,
                    ).count()
                ),
                "new_this_month": (
                    Member.objects.filter(
                        joined_at__date__gte=(
                            month_start
                        ),
                        joined_at__date__lte=(
                            today
                        ),
                    ).count()
                ),
            },

            "subscriptions": {
                "active": (
                    active_subscriptions
                ),
                "expiring_soon": (
                    expiring_soon
                ),
                "expired": (
                    expired_subscriptions
                ),
                "suspended": (
                    suspended_subscriptions
                ),
            },

            "revenue": {
                "total": total_revenue,
                "current_month": (
                    monthly_revenue
                ),
                "previous_month": (
                    previous_month_revenue
                ),
                "growth_percent": (
                    revenue_growth
                ),
            },

            "analytics": {
                "monthly": monthly_series,
                "attendance": (
                    attendance_series
                ),
                "plan_distribution": (
                    plan_distribution
                ),
            },

            "recent_payments": (
                PaymentSerializer(
                    recent_payments,
                    many=True,
                ).data
            ),
        }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )