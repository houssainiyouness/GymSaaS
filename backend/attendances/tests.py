import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from members.models import (
    Member,
    MembershipPlan,
    Subscription,
)

from .models import Attendance


User = get_user_model()


class AttendanceAPITests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            username="attendance-coordinator",
            password="TestPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.member_user = User.objects.create_user(
            username="attendance-member",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.member = Member.objects.create(
            user=self.member_user,
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Présence",
            duration_days=30,
            price="300.00",
        )
        self.subscription = Subscription.objects.create(
            member=self.member,
            plan=self.plan,
        )

        self.member_without_subscription_user = (
            User.objects.create_user(
                username="member-without-subscription",
                password="TestPassword123!",
                role=User.Role.MEMBER,
            )
        )
        self.member_without_subscription = (
            Member.objects.create(
                user=(
                    self.member_without_subscription_user
                ),
            )
        )

        self.list_url = reverse(
            "attendance-list",
        )
        self.qr_checkin_url = reverse(
            "attendance-qr-checkin",
        )
        self.currently_present_url = reverse(
            "attendance-currently-present",
        )
        self.summary_url = reverse(
            "attendance-summary",
        )

    def test_anonymous_user_cannot_access_attendances(
        self,
    ):
        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_member_cannot_access_attendances(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_coordinator_can_register_check_in(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.list_url,
            {
                "member": self.member.id,
                "entry_method": (
                    Attendance.EntryMethod.MANUAL
                ),
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            Attendance.objects.count(),
            1,
        )

        attendance = Attendance.objects.get()

        self.assertEqual(
            attendance.recorded_by,
            self.coordinator,
        )
        self.assertIsNone(
            attendance.check_out,
        )

    def test_member_without_subscription_cannot_check_in(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.list_url,
            {
                "member": (
                    self.member_without_subscription.id
                ),
                "entry_method": (
                    Attendance.EntryMethod.MANUAL
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "member",
            response.data,
        )
        self.assertEqual(
            Attendance.objects.count(),
            0,
        )

    def test_member_cannot_have_two_open_attendances(
        self,
    ):
        Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.list_url,
            {
                "member": self.member.id,
                "entry_method": (
                    Attendance.EntryMethod.MANUAL
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "member",
            response.data,
        )
        self.assertEqual(
            Attendance.objects.count(),
            1,
        )

    def test_coordinator_can_register_checkout(self):
        attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse(
                "attendance-checkout",
                kwargs={
                    "pk": attendance.id,
                },
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        attendance.refresh_from_db()

        self.assertIsNotNone(
            attendance.check_out,
        )

    def test_checkout_cannot_be_registered_twice(self):
        attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        checkout_url = reverse(
            "attendance-checkout",
            kwargs={
                "pk": attendance.id,
            },
        )

        first_response = self.client.post(
            checkout_url,
            format="json",
        )
        second_response = self.client.post(
            checkout_url,
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_coordinator_can_register_qr_check_in(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.qr_checkin_url,
            {
                "qr_code": str(
                    self.member.qr_code,
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            Attendance.objects.count(),
            1,
        )

        attendance = Attendance.objects.get()

        self.assertEqual(
            attendance.member,
            self.member,
        )
        self.assertEqual(
            attendance.entry_method,
            Attendance.EntryMethod.QR_CODE,
        )
        self.assertEqual(
            attendance.recorded_by,
            self.coordinator,
        )

    def test_invalid_qr_code_format_is_rejected(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.qr_checkin_url,
            {
                "qr_code": "qr-code-invalide",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "qr_code",
            response.data,
        )
        self.assertEqual(
            Attendance.objects.count(),
            0,
        )

    def test_unknown_qr_code_is_rejected(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.qr_checkin_url,
            {
                "qr_code": str(
                    uuid.uuid4(),
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "qr_code",
            response.data,
        )
        self.assertEqual(
            Attendance.objects.count(),
            0,
        )

    def test_attendance_returns_duration_and_status(
        self,
    ):
        now = timezone.now()

        attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        Attendance.objects.filter(
            pk=attendance.pk,
        ).update(
            check_in=now - timedelta(minutes=30),
            check_out=now,
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            reverse(
                "attendance-detail",
                kwargs={
                    "pk": attendance.id,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["duration_minutes"],
            30,
        )
        self.assertEqual(
            response.data["attendance_status"],
            "checked_out",
        )

    def test_attendances_can_be_filtered_by_member(
        self,
    ):
        own_attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        Attendance.objects.create(
            member=self.member_without_subscription,
            recorded_by=self.coordinator,
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.list_url,
            {
                "member": self.member.id,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(response.data),
            1,
        )
        self.assertEqual(
            response.data[0]["id"],
            own_attendance.id,
        )

    def test_attendances_can_be_filtered_by_status(
        self,
    ):
        open_attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        Attendance.objects.create(
            member=self.member_without_subscription,
            recorded_by=self.coordinator,
            check_out=timezone.now(),
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.list_url,
            {
                "status": "present",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(response.data),
            1,
        )
        self.assertEqual(
            response.data[0]["id"],
            open_attendance.id,
        )

    def test_attendances_can_be_filtered_by_date(
        self,
    ):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        today_attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        yesterday_attendance = Attendance.objects.create(
            member=self.member_without_subscription,
            recorded_by=self.coordinator,
        )

        Attendance.objects.filter(
            pk=yesterday_attendance.pk,
        ).update(
            check_in=timezone.now() - timedelta(days=1),
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.list_url,
            {
                "date_from": str(today),
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            len(response.data),
            1,
        )
        self.assertEqual(
            response.data[0]["id"],
            today_attendance.id,
        )
        self.assertNotEqual(
            response.data[0]["id"],
            yesterday_attendance.id,
        )
        self.assertNotEqual(
            today,
            yesterday,
        )

    def test_invalid_date_filter_is_rejected(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.list_url,
            {
                "date_from": "date-invalide",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "date_from",
            response.data,
        )

    def test_coordinator_can_list_currently_present(
        self,
    ):
        open_attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        Attendance.objects.create(
            member=self.member_without_subscription,
            recorded_by=self.coordinator,
            check_out=timezone.now(),
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.currently_present_url,
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
            len(response.data["attendances"]),
            1,
        )
        self.assertEqual(
            response.data["attendances"][0]["id"],
            open_attendance.id,
        )

    def test_summary_returns_attendance_statistics(
        self,
    ):
        now = timezone.now()

        completed_attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
        )
        Attendance.objects.filter(
            pk=completed_attendance.pk,
        ).update(
            check_in=now - timedelta(minutes=30),
            check_out=now,
        )

        Attendance.objects.create(
            member=self.member_without_subscription,
            recorded_by=self.coordinator,
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.summary_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["today"]["total_check_ins"],
            2,
        )
        self.assertEqual(
            response.data["today"]["currently_present"],
            1,
        )
        self.assertEqual(
            response.data["today"]["checked_out"],
            1,
        )
        self.assertEqual(
            response.data["today"]["unique_members"],
            2,
        )
        self.assertEqual(
            response.data["today"][
                "average_duration_minutes"
            ],
            30.0,
        )
        self.assertEqual(
            response.data["current_month"][
                "total_check_ins"
            ],
            2,
        )

    def test_member_cannot_access_attendance_summary(
        self,
    ):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.summary_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )