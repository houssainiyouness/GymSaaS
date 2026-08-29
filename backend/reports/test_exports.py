from datetime import timedelta
import csv
import io

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from attendances.models import Attendance
from members.models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)


User = get_user_model()


class CSVExportsAPITests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            username="exports-coordinator",
            password="TestPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.member_user = User.objects.create_user(
            username="exports-member",
            email="exports-member@test.com",
            password="TestPassword123!",
            role=User.Role.MEMBER,
            first_name="Membre",
            last_name="Export",
            phone="0600000000",
        )
        self.member = Member.objects.create(
            user=self.member_user,
            address="Adresse de test",
            emergency_phone="0611111111",
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Export",
            duration_days=30,
            price="300.00",
        )
        self.subscription = Subscription.objects.create(
            member=self.member,
            plan=self.plan,
        )

        self.current_payment = Payment.objects.create(
            subscription=self.subscription,
            amount="100.00",
            method=Payment.Method.CASH,
            reference="CURRENT-EXPORT",
        )
        self.old_payment = Payment.objects.create(
            subscription=self.subscription,
            amount="50.00",
            method=Payment.Method.TRANSFER,
            reference="OLD-EXPORT",
        )

        Payment.objects.filter(
            pk=self.old_payment.pk,
        ).update(
            paid_at=timezone.now() - timedelta(days=60),
        )

        self.attendance = Attendance.objects.create(
            member=self.member,
            recorded_by=self.coordinator,
            notes="Présence de test",
        )

        self.members_url = reverse(
            "members-csv-export",
        )
        self.payments_url = reverse(
            "payments-csv-export",
        )
        self.attendances_url = reverse(
            "attendances-csv-export",
        )

    def decode_csv(self, response):
        return response.content.decode(
            "utf-8-sig",
        )

    def read_csv(self, response):
        return list(
            csv.reader(
                io.StringIO(
                    self.decode_csv(response),
                ),
                delimiter=";",
            )
        )

    def test_anonymous_user_cannot_export_csv(self):
        protected_urls = (
            self.members_url,
            self.payments_url,
            self.attendances_url,
        )

        for url in protected_urls:
            with self.subTest(url=url):
                response = self.client.get(url)

                self.assertEqual(
                    response.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                )

    def test_member_cannot_export_csv(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        protected_urls = (
            self.members_url,
            self.payments_url,
            self.attendances_url,
        )

        for url in protected_urls:
            with self.subTest(url=url):
                response = self.client.get(url)

                self.assertEqual(
                    response.status_code,
                    status.HTTP_403_FORBIDDEN,
                )

    def test_coordinator_can_export_members(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.members_url,
        )
        content = self.decode_csv(response)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertTrue(
            response["Content-Type"].startswith(
                "text/csv",
            )
        )
        self.assertIn(
            'attachment; filename="membres.csv"',
            response["Content-Disposition"],
        )
        self.assertIn(
            "Nom d’utilisateur",
            content,
        )
        self.assertIn(
            "exports-member",
            content,
        )
        self.assertIn(
            "exports-member@test.com",
            content,
        )
        self.assertIn(
            str(self.member.qr_code),
            content,
        )

        rows = self.read_csv(response)

        self.assertEqual(
            rows[0][1],
            "Nom d’utilisateur",
        )
        self.assertEqual(
            len(rows[0]),
            11,
        )

    def test_coordinator_can_export_payments(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.payments_url,
        )
        content = self.decode_csv(response)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn(
            "CURRENT-EXPORT",
            content,
        )
        self.assertIn(
            "OLD-EXPORT",
            content,
        )
        self.assertIn(
            "Formule Export",
            content,
        )
        self.assertIn(
            "100,00",
            content,
        )
        self.assertIn(
            "Montant (DH)",
            content,
        )

    def test_csv_protects_formula_like_values(self):
        self.member.address = "=2+2"
        self.member.save(
            update_fields=(
                "address",
            ),
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.members_url,
        )
        content = self.decode_csv(response)

        self.assertIn(
            "'=2+2",
            content,
        )

    def test_payments_export_can_be_filtered_by_date(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        today = timezone.localdate()

        response = self.client.get(
            self.payments_url,
            {
                "start_date": str(today),
                "end_date": str(today),
            },
        )
        content = self.decode_csv(response)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn(
            "CURRENT-EXPORT",
            content,
        )
        self.assertNotIn(
            "OLD-EXPORT",
            content,
        )

    def test_coordinator_can_export_attendances(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.attendances_url,
        )
        content = self.decode_csv(response)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn(
            "Entrée",
            content,
        )
        self.assertIn(
            "Sortie",
            content,
        )
        self.assertIn(
            "Membre Export",
            content,
        )
        self.assertIn(
            "Présence de test",
            content,
        )

    def test_invalid_export_date_is_rejected(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.payments_url,
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

    def test_export_end_date_before_start_is_rejected(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.attendances_url,
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
