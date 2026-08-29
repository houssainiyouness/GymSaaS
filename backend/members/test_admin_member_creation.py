from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Member


User = get_user_model()


class AdminMemberCreationAPITests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            username="creation-coordinator",
            email="coordinator@test.com",
            password="StrongPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.regular_member_user = User.objects.create_user(
            username="creation-regular-member",
            email="regular-member@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )
        self.regular_member = Member.objects.create(
            user=self.regular_member_user,
        )

        self.url = reverse(
            "admin-member-create",
        )

        self.valid_data = {
            "username": "admin-created-member",
            "email": "admin-created@test.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "Membre",
            "last_name": "Administratif",
            "phone": "0600000000",
            "preferred_language": "fr",
            "birth_date": "2000-01-15",
            "address": "Casablanca",
            "emergency_phone": "0611111111",
            "is_active": True,
        }

    def test_anonymous_user_cannot_create_member(self):
        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertFalse(
            User.objects.filter(
                username="admin-created-member",
            ).exists()
        )

    def test_regular_member_cannot_create_member(self):
        self.client.force_authenticate(
            user=self.regular_member_user,
        )

        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertFalse(
            User.objects.filter(
                username="admin-created-member",
            ).exists()
        )

    def test_coordinator_can_create_member(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            username="admin-created-member",
        )
        member = Member.objects.get(
            user=user,
        )

        self.assertEqual(
            user.role,
            User.Role.MEMBER,
        )
        self.assertTrue(
            user.check_password(
                "StrongPassword123!",
            )
        )
        self.assertEqual(
            user.email,
            "admin-created@test.com",
        )
        self.assertEqual(
            user.first_name,
            "Membre",
        )
        self.assertEqual(
            user.last_name,
            "Administratif",
        )
        self.assertTrue(
            user.is_active,
        )
        self.assertTrue(
            member.is_active,
        )
        self.assertEqual(
            member.address,
            "Casablanca",
        )
        self.assertEqual(
            member.emergency_phone,
            "0611111111",
        )
        self.assertIsNotNone(
            member.qr_code,
        )

        self.assertEqual(
            response.data["user"]["role"],
            User.Role.MEMBER,
        )
        self.assertEqual(
            response.data["member"]["id"],
            member.id,
        )

    def test_coordinator_can_create_inactive_member(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        inactive_data = {
            **self.valid_data,
            "username": "inactive-created-member",
            "email": "inactive-created@test.com",
            "is_active": False,
        }

        response = self.client.post(
            self.url,
            inactive_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            username="inactive-created-member",
        )
        member = Member.objects.get(
            user=user,
        )

        self.assertFalse(
            user.is_active,
        )
        self.assertFalse(
            member.is_active,
        )

    def test_administration_cannot_choose_another_role(
        self,
    ):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        data = {
            **self.valid_data,
            "role": User.Role.SUPER_ADMIN,
        }

        response = self.client.post(
            self.url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            username="admin-created-member",
        )

        self.assertEqual(
            user.role,
            User.Role.MEMBER,
        )
        self.assertFalse(
            user.is_superuser,
        )

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(
            username="admin-created-member",
            email="existing-member@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "username",
            response.data,
        )
        self.assertEqual(
            Member.objects.filter(
                user__username="admin-created-member",
            ).count(),
            0,
        )

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existing-created-member",
            email="admin-created@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            self.url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "email",
            response.data,
        )
        self.assertFalse(
            Member.objects.filter(
                user__username="admin-created-member",
            ).exists()
        )

    def test_password_confirmation_must_match(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        invalid_data = {
            **self.valid_data,
            "password_confirm": (
                "AnotherPassword123!"
            ),
        }

        response = self.client.post(
            self.url,
            invalid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "password_confirm",
            response.data,
        )
        self.assertFalse(
            User.objects.filter(
                username="admin-created-member",
            ).exists()
        )
        self.assertFalse(
            Member.objects.filter(
                user__username="admin-created-member",
            ).exists()
        )