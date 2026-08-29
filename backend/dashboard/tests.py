from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from members.models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)


User = get_user_model()


class DashboardAPITests(APITestCase):
    def setUp(self):
        self.member_user = User.objects.create_user(
            username="dashboard-member",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.member = Member.objects.create(
            user=self.member_user,
        )

        self.coordinator = User.objects.create_user(
            username="dashboard-coordinator",
            password="TestPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Dashboard",
            duration_days=30,
            price="300.00",
        )

        self.subscription = Subscription.objects.create(
            member=self.member,
            plan=self.plan,
        )

        self.payment = Payment.objects.create(
            subscription=self.subscription,
            amount="100.00",
            method=Payment.Method.CASH,
            reference="DASH-001",
        )

        self.url = reverse("dashboard-summary")

    def test_anonymous_user_cannot_access_dashboard(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_member_cannot_access_dashboard(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_coordinator_can_access_dashboard(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_dashboard_returns_correct_statistics(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(self.url)

        self.assertEqual(response.data["members"]["total"], 1)
        self.assertEqual(response.data["members"]["active"], 1)
        self.assertEqual(
            response.data["subscriptions"]["active"],
            1,
        )
        self.assertEqual(
            response.data["revenue"]["total"],
            Decimal("100.00"),
        )
        self.assertEqual(
            response.data["revenue"]["current_month"],
            Decimal("100.00"),
        )

    def test_dashboard_returns_recent_payments(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(self.url)

        self.assertEqual(
            len(response.data["recent_payments"]),
            1,
        )
        self.assertEqual(
            response.data["recent_payments"][0]["reference"],
            "DASH-001",
        )