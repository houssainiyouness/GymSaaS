from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)


User = get_user_model()


class AlertsAPITests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            username="alerts-coordinator",
            password="TestPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.regular_member_user = User.objects.create_user(
            username="alerts-regular-member",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.regular_member = Member.objects.create(
            user=self.regular_member_user,
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Alertes",
            duration_days=30,
            price="300.00",
        )

        self.expiring_member = self.create_member(
            "expiring-member",
        )
        self.expired_member = self.create_member(
            "expired-member",
        )
        self.suspended_member = self.create_member(
            "suspended-member",
        )
        self.partial_payment_member = self.create_member(
            "partial-payment-member",
        )
        self.no_subscription_member = self.create_member(
            "no-subscription-member",
        )

        self.expiring_subscription = (
            Subscription.objects.create(
                member=self.expiring_member,
                plan=self.plan,
            )
        )
        self.expired_subscription = (
            Subscription.objects.create(
                member=self.expired_member,
                plan=self.plan,
            )
        )
        self.suspended_subscription = (
            Subscription.objects.create(
                member=self.suspended_member,
                plan=self.plan,
                is_suspended=True,
            )
        )
        self.partial_payment_subscription = (
            Subscription.objects.create(
                member=self.partial_payment_member,
                plan=self.plan,
            )
        )

        today = timezone.localdate()

        Subscription.objects.filter(
            pk=self.expiring_subscription.pk,
        ).update(
            start_date=today - timedelta(days=25),
            end_date=today + timedelta(days=5),
        )

        Subscription.objects.filter(
            pk=self.expired_subscription.pk,
        ).update(
            start_date=today - timedelta(days=40),
            end_date=today - timedelta(days=10),
        )

        self.expiring_subscription.refresh_from_db()
        self.expired_subscription.refresh_from_db()
        self.suspended_subscription.refresh_from_db()
        self.partial_payment_subscription.refresh_from_db()

        Payment.objects.create(
            subscription=self.expiring_subscription,
            amount="300.00",
            method=Payment.Method.CASH,
            reference="FULL-EXPIRING",
        )
        Payment.objects.create(
            subscription=self.expired_subscription,
            amount="300.00",
            method=Payment.Method.CASH,
            reference="FULL-EXPIRED",
        )
        Payment.objects.create(
            subscription=self.suspended_subscription,
            amount="300.00",
            method=Payment.Method.CARD,
            reference="FULL-SUSPENDED",
        )
        Payment.objects.create(
            subscription=self.partial_payment_subscription,
            amount="100.00",
            method=Payment.Method.CASH,
            reference="PARTIAL-PAYMENT",
        )

        self.subscription_alerts_url = reverse(
            "subscription-alerts",
        )
        self.payment_alerts_url = reverse(
            "payment-alerts",
        )

    def create_member(self, username):
        user = User.objects.create_user(
            username=username,
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )

        return Member.objects.create(
            user=user,
        )

    def test_anonymous_user_cannot_access_alerts(self):
        protected_urls = (
            self.subscription_alerts_url,
            self.payment_alerts_url,
        )

        for url in protected_urls:
            with self.subTest(url=url):
                response = self.client.get(url)

                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                )

    def test_member_cannot_access_alerts(self):
        self.client.force_authenticate(
            user=self.regular_member_user,
        )

        protected_urls = (
            self.subscription_alerts_url,
            self.payment_alerts_url,
        )

        for url in protected_urls:
            with self.subTest(url=url):
                response = self.client.get(url)

                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                )

    def test_subscription_alerts_return_correct_counts(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.subscription_alerts_url,
            {
                "days": "7",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["period_days"],
            7,
        )
        self.assertEqual(
            response.data["counts"]["expiring_soon"],
            1,
        )
        self.assertEqual(
            response.data["counts"]["expired"],
            1,
        )
        self.assertEqual(
            response.data["counts"]["suspended"],
            1,
        )
        self.assertEqual(
            response.data["counts"][
                "members_without_active_subscription"
            ],
            4,
        )
        self.assertEqual(
            response.data["expiring_soon"][0]["id"],
            self.expiring_subscription.id,
        )

    def test_allowed_alert_periods_are_accepted(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        for days in (7, 15, 30):
            with self.subTest(days=days):
                response = self.client.get(
                    self.subscription_alerts_url,
                    {
                        "days": str(days),
                    },
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_200_OK,
                )
                self.assertEqual(
                    response.data["period_days"],
                    days,
                )

    def test_invalid_alert_period_is_rejected(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        invalid_values = (
            "abc",
            "5",
            "60",
        )

        for value in invalid_values:
            with self.subTest(value=value):
                response = self.client.get(
                    self.subscription_alerts_url,
                    {
                        "days": value,
                    },
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                )
                self.assertIn(
                    "days",
                    response.data,
                )

    def test_payment_alerts_return_remaining_amounts(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.payment_alerts_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["count"],
            1,
        )
        self.assertEqual(
            response.data["total_remaining"],
            Decimal("200.00"),
        )
        self.assertEqual(
            len(response.data["alerts"]),
            1,
        )

        alert = response.data["alerts"][0]

        self.assertEqual(
            alert["subscription_id"],
            self.partial_payment_subscription.id,
        )
        self.assertEqual(
            alert["member_id"],
            self.partial_payment_member.id,
        )
        self.assertEqual(
            alert["total_paid"],
            Decimal("100.00"),
        )
        self.assertEqual(
            alert["remaining_amount"],
            Decimal("200.00"),
        )