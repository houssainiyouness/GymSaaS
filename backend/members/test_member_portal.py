from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from attendances.models import Attendance

from .models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)


User = get_user_model()


class MemberPortalAPITests(APITestCase):
    def setUp(self):
        self.member_user = User.objects.create_user(
            username="portal-member",
            email="portal-member@test.com",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.member = Member.objects.create(
            user=self.member_user,
        )

        self.other_member_user = User.objects.create_user(
            username="other-member",
            email="other-member@test.com",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.other_member = Member.objects.create(
            user=self.other_member_user,
        )

        self.user_without_profile = User.objects.create_user(
            username="member-without-profile",
            email="without-profile@test.com",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Portail",
            duration_days=30,
            price="300.00",
        )

        self.subscription = Subscription.objects.create(
            member=self.member,
            plan=self.plan,
        )
        self.other_subscription = Subscription.objects.create(
            member=self.other_member,
            plan=self.plan,
        )

        self.payment = Payment.objects.create(
            subscription=self.subscription,
            amount="100.00",
            method=Payment.Method.CASH,
            reference="PORTAL-PAYMENT",
        )
        self.other_payment = Payment.objects.create(
            subscription=self.other_subscription,
            amount="50.00",
            method=Payment.Method.CARD,
            reference="OTHER-PAYMENT",
        )

        self.attendance = Attendance.objects.create(
            member=self.member,
        )
        self.other_attendance = Attendance.objects.create(
            member=self.other_member,
        )

        self.profile_url = reverse(
            "member-me",
        )
        self.subscription_url = reverse(
            "member-subscription",
        )
        self.payments_url = reverse(
            "member-payments",
        )
        self.attendances_url = reverse(
            "member-attendances",
        )
        self.qr_code_url = reverse(
            "member-qr-code",
        )

    def test_anonymous_user_cannot_access_portal(self):
        protected_urls = (
            self.profile_url,
            self.subscription_url,
            self.payments_url,
            self.attendances_url,
            self.qr_code_url,
        )

        for url in protected_urls:
            with self.subTest(url=url):
                response = self.client.get(url)

                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                )

    def test_member_can_access_own_profile(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.profile_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["id"],
            self.member.id,
        )
        self.assertEqual(
            response.data["username"],
            self.member_user.username,
        )
        self.assertEqual(
            response.data["email"],
            self.member_user.email,
        )
        self.assertEqual(
            str(response.data["qr_code"]),
            str(self.member.qr_code),
        )

    def test_member_cannot_request_another_profile(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.profile_url,
            {
                "member": self.other_member.id,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["id"],
            self.member.id,
        )
        self.assertNotEqual(
            response.data["id"],
            self.other_member.id,
        )

    def test_user_without_member_profile_receives_404(self):
        self.client.force_authenticate(
            user=self.user_without_profile,
        )

        response = self.client.get(
            self.profile_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_member_can_access_active_subscription(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.subscription_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIsNotNone(
            response.data["subscription"],
        )
        self.assertEqual(
            response.data["subscription"]["id"],
            self.subscription.id,
        )
        self.assertEqual(
            response.data["subscription"]["member"],
            self.member.id,
        )

    def test_member_only_receives_own_payments(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.payments_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(response.data["payments"]),
            1,
        )
        self.assertEqual(
            response.data["payments"][0]["id"],
            self.payment.id,
        )
        self.assertEqual(
            response.data["payments"][0]["reference"],
            "PORTAL-PAYMENT",
        )

    def test_member_only_receives_own_attendances(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.attendances_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(response.data["attendances"]),
            1,
        )
        self.assertEqual(
            response.data["attendances"][0]["id"],
            self.attendance.id,
        )
        self.assertEqual(
            response.data["attendances"][0]["member"],
            self.member.id,
        )

    def test_member_can_access_own_qr_code(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.qr_code_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["member_id"],
            self.member.id,
        )
        self.assertEqual(
            str(response.data["qr_code"]),
            str(self.member.qr_code),
        )