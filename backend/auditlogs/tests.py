from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from members.models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)

from .models import AuditLog
from .services import create_audit_log


User = get_user_model()


class AuditLogAPITests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            username="audit-coordinator",
            email="audit-coordinator@test.com",
            password="StrongPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.member_user = User.objects.create_user(
            username="audit-member",
            email="audit-member@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )
        self.member = Member.objects.create(
            user=self.member_user,
        )

        self.plan = MembershipPlan.objects.create(
            name="Formule Audit",
            duration_days=30,
            price="300.00",
        )
        self.subscription = Subscription.objects.create(
            member=self.member,
            plan=self.plan,
        )

        self.list_url = reverse(
            "audit-log-list",
        )
        self.attendance_url = reverse(
            "attendance-list",
        )
        self.payment_url = reverse(
            "payment-list",
        )
        self.login_url = reverse(
            "auth-login",
        )

    def test_service_creates_audit_log(self):
        request = RequestFactory().post(
            "/api/test/",
            REMOTE_ADDR="127.0.0.1",
        )
        request.user = self.coordinator

        audit_log = create_audit_log(
            request=request,
            action=AuditLog.Action.CREATE,
            entity=self.member,
            description="Création de test.",
            metadata={
                "amount": Decimal("12.50"),
                "member_id": self.member.id,
            },
        )

        self.assertEqual(
            AuditLog.objects.count(),
            1,
        )
        self.assertEqual(
            audit_log.actor,
            self.coordinator,
        )
        self.assertEqual(
            audit_log.action,
            AuditLog.Action.CREATE,
        )
        self.assertEqual(
            audit_log.entity_type,
            "members.Member",
        )
        self.assertEqual(
            audit_log.entity_id,
            str(self.member.id),
        )
        self.assertEqual(
            audit_log.ip_address,
            "127.0.0.1",
        )
        self.assertEqual(
            audit_log.metadata["amount"],
            "12.50",
        )

    def test_forwarded_ip_address_is_recorded(self):
        request = RequestFactory().post(
            "/api/test/",
            HTTP_X_FORWARDED_FOR=(
                "203.0.113.10, 127.0.0.1"
            ),
        )
        request.user = self.coordinator

        audit_log = create_audit_log(
            request=request,
            action=AuditLog.Action.UPDATE,
            entity=self.member,
            description="Test de l’adresse IP.",
        )

        self.assertEqual(
            audit_log.ip_address,
            "203.0.113.10",
        )

    def test_anonymous_user_cannot_access_logs(self):
        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_member_cannot_access_logs(self):
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

    def test_coordinator_can_access_logs(self):
        AuditLog.objects.create(
            actor=self.coordinator,
            action=AuditLog.Action.CREATE,
            entity_type="members.Member",
            entity_id=str(self.member.id),
            description="Journal visible.",
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            self.list_url,
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
            response.data[0]["actor_username"],
            self.coordinator.username,
        )
        self.assertEqual(
            response.data[0]["action"],
            AuditLog.Action.CREATE,
        )

    def test_audit_log_api_is_read_only(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.list_url,
            {
                "action": AuditLog.Action.CREATE,
                "entity_type": "Test",
                "description": "Tentative interdite.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertEqual(
            AuditLog.objects.count(),
            0,
        )

    def test_manual_check_in_creates_audit_log(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.attendance_url,
            {
                "member": self.member.id,
                "entry_method": "manual",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        audit_log = AuditLog.objects.get(
            action=AuditLog.Action.CHECK_IN,
        )

        self.assertEqual(
            audit_log.actor,
            self.coordinator,
        )
        self.assertEqual(
            audit_log.entity_type,
            "attendances.Attendance",
        )
        self.assertEqual(
            audit_log.metadata["member_id"],
            self.member.id,
        )
        self.assertEqual(
            audit_log.metadata["entry_method"],
            "manual",
        )

    def test_payment_creation_creates_audit_log(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.payment_url,
            {
                "subscription": self.subscription.id,
                "amount": "100.00",
                "method": Payment.Method.CASH,
                "reference": "AUDIT-PAYMENT",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        audit_log = AuditLog.objects.get(
            action=AuditLog.Action.PAYMENT,
        )

        self.assertEqual(
            audit_log.actor,
            self.coordinator,
        )
        self.assertEqual(
            audit_log.entity_type,
            "members.Payment",
        )
        self.assertEqual(
            audit_log.metadata["amount"],
            "100.00",
        )
        self.assertEqual(
            audit_log.metadata["reference"],
            "AUDIT-PAYMENT",
        )

    def test_successful_login_creates_audit_log(self):
        response = self.client.post(
            self.login_url,
            {
                "username": self.member_user.username,
                "password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        audit_log = AuditLog.objects.get(
            action=AuditLog.Action.LOGIN,
        )

        self.assertEqual(
            audit_log.actor,
            self.member_user,
        )
        self.assertEqual(
            audit_log.entity_type,
            "accounts.User",
        )
        self.assertEqual(
            audit_log.metadata["role"],
            User.Role.MEMBER,
        )