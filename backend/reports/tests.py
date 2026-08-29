from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from members.models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)


User = get_user_model()


class FinancialReportAPITests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            username="reports-coordinator",
            password="TestPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.member_user = User.objects.create_user(
            username="reports-member",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.member = Member.objects.create(
            user=self.member_user,
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Rapports",
            duration_days=30,
            price="300.00",
        )

        self.subscription = Subscription.objects.create(
            member=self.member,
            plan=self.plan,
        )

        self.cash_payment = Payment.objects.create(
            subscription=self.subscription,
            amount="100.00",
            method=Payment.Method.CASH,
            reference="REPORT-CASH",
        )
        self.card_payment = Payment.objects.create(
            subscription=self.subscription,
            amount="50.00",
            method=Payment.Method.CARD,
            reference="REPORT-CARD",
        )
        self.old_payment = Payment.objects.create(
            subscription=self.subscription,
            amount="25.00",
            method=Payment.Method.TRANSFER,
            reference="REPORT-OLD",
        )

        Payment.objects.filter(
            pk=self.old_payment.pk,
        ).update(
            paid_at=timezone.now() - timedelta(days=60),
        )

        self.url = reverse(
            "financial-report",
        )

    def test_anonymous_user_cannot_access_report(self):
        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_member_cannot_access_report(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_coordinator_can_access_financial_report(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["revenue"]["total"],
            Decimal("150.00"),
        )
        self.assertEqual(
            response.data["revenue"]["payment_count"],
            2,
        )
        self.assertEqual(
            response.data["revenue"]["average_payment"],
            Decimal("75.00"),
        )

    def test_report_returns_payments_by_method(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        methods = {
            item["method"]: item
            for item in response.data[
                "payments_by_method"
            ]
        }

        self.assertEqual(
            methods[Payment.Method.CASH]["count"],
            1,
        )
        self.assertEqual(
            methods[Payment.Method.CASH]["total"],
            Decimal("100.00"),
        )
        self.assertEqual(
            methods[Payment.Method.CARD]["count"],
            1,
        )
        self.assertEqual(
            methods[Payment.Method.CARD]["total"],
            Decimal("50.00"),
        )
        self.assertNotIn(
            Payment.Method.TRANSFER,
            methods,
        )

    def test_report_returns_daily_revenue(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(response.data["daily_revenue"]),
            1,
        )
        self.assertEqual(
            response.data["daily_revenue"][0]["total"],
            Decimal("150.00"),
        )
        self.assertEqual(
            response.data["daily_revenue"][0]["count"],
            2,
        )

    def test_report_returns_outstanding_amounts(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["outstanding"][
                "subscription_count"
            ],
            1,
        )
        self.assertEqual(
            response.data["outstanding"][
                "total_remaining"
            ],
            Decimal("125.00"),
        )

        outstanding_subscription = (
            response.data["outstanding"][
                "subscriptions"
            ][0]
        )

        self.assertEqual(
            outstanding_subscription[
                "subscription_id"
            ],
            self.subscription.id,
        )
        self.assertEqual(
            outstanding_subscription["total_paid"],
            Decimal("175.00"),
        )
        self.assertEqual(
            outstanding_subscription[
                "remaining_amount"
            ],
            Decimal("125.00"),
        )

    def test_report_accepts_custom_date_period(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        today = timezone.localdate()

        response = self.client.get(
            self.url,
            {
                "start_date": str(today),
                "end_date": str(today),
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["period"]["start_date"],
            today,
        )
        self.assertEqual(
            response.data["period"]["end_date"],
            today,
        )
        self.assertEqual(
            response.data["revenue"]["total"],
            Decimal("150.00"),
        )

    def test_invalid_date_format_is_rejected(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.url,
            {
                "start_date": "date-invalide",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "start_date",
            response.data,
        )

    def test_end_date_before_start_date_is_rejected(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.url,
            {
                "start_date": "2026-08-15",
                "end_date": "2026-08-01",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "end_date",
            response.data,
        )