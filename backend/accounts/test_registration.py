from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from members.models import Member


User = get_user_model()


class PublicRegistrationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse(
            "auth-register",
        )
        self.login_url = reverse(
            "auth-login",
        )

        self.valid_data = {
            "username": "new-public-member",
            "email": "new-member@test.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "Nouveau",
            "last_name": "Membre",
            "phone": "0600000000",
            "preferred_language": "fr",
            "birth_date": "2000-01-15",
            "address": "Casablanca",
            "emergency_phone": "0611111111",
        }

    def test_visitor_can_create_member_account(self):
        response = self.client.post(
            self.register_url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            User.objects.count(),
            1,
        )
        self.assertEqual(
            Member.objects.count(),
            1,
        )
        user = User.objects.get(
            username="new-public-member",
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
        self.assertNotEqual(
            user.password,
            "StrongPassword123!",
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

        self.assertIn(
            "access",
            response.data,
        )
        self.assertIn(
            "refresh",
            response.data,
        )
        self.assertEqual(
            response.data["user"]["role"],
            User.Role.MEMBER,
        )
        self.assertEqual(
            response.data["member"]["id"],
            member.id,
        )
        self.assertEqual(
            str(
                response.data["member"][
                    "qr_code"
                ]
            ),
            str(member.qr_code),
        )

    def test_public_registration_always_forces_member_role(
        self,
    ):
        registration_data = {
            **self.valid_data,
            "role": User.Role.SUPER_ADMIN,
        }

        response = self.client.post(
            self.register_url,
            registration_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            username="new-public-member",
        )

        self.assertEqual(
            user.role,
            User.Role.MEMBER,
        )
        self.assertFalse(
            user.is_superuser,
        )
        self.assertFalse(
            user.is_staff,
        )

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(
            username="new-public-member",
            email="existing@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )

        response = self.client.post(
            self.register_url,
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
            Member.objects.count(),
            0,
        )

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existing-member",
            email="new-member@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )

        response = self.client.post(
            self.register_url,
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
        self.assertEqual(
            Member.objects.count(),
            0,
        )

    def test_password_confirmation_must_match(self):
        registration_data = {
            **self.valid_data,
            "password_confirm": (
                "AnotherPassword123!"
            ),
        }

        response = self.client.post(
            self.register_url,
            registration_data,
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
        self.assertEqual(
            User.objects.count(),
            0,
        )
        self.assertEqual(
            Member.objects.count(),
            0,
        )

    def test_weak_password_is_rejected(self):
        registration_data = {
            **self.valid_data,
            "password": "123",
            "password_confirm": "123",
        }

        response = self.client.post(
            self.register_url,
            registration_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "password",
            response.data,
        )
        self.assertEqual(
            User.objects.count(),
            0,
        )
        self.assertEqual(
            Member.objects.count(),
            0,
        )

    def test_registered_member_can_login(self):
        registration_response = self.client.post(
            self.register_url,
            self.valid_data,
            format="json",
        )

        self.assertEqual(
            registration_response.status_code,
            status.HTTP_201_CREATED,
        )

        login_response = self.client.post(
            self.login_url,
            {
                "username": "new-public-member",
                "password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            login_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn(
            "access",
            login_response.data,
        )
        self.assertIn(
            "refresh",
            login_response.data,
        )
        self.assertEqual(
            login_response.data["user"]["role"],
            User.Role.MEMBER,
        )
