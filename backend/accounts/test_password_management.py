from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class ChangePasswordAPITests(APITestCase):
    def setUp(self):
        self.old_password = "StrongPassword123!"
        self.new_password = "NewStrongPassword456!"

        self.user = User.objects.create_user(
            username="password-member",
            email="password-member@test.com",
            password=self.old_password,
            role=User.Role.MEMBER,
        )

        old_refresh = RefreshToken.for_user(
            self.user,
        )
        self.old_refresh = str(old_refresh)
        self.old_access = str(
            old_refresh.access_token,
        )

        self.url = reverse(
            "auth-change-password",
        )
        self.login_url = reverse(
            "auth-login",
        )

    def test_anonymous_user_cannot_change_password(
        self,
    ):
        response = self.client.post(
            self.url,
            {
                "old_password": self.old_password,
                "new_password": self.new_password,
                "new_password_confirm": (
                    self.new_password
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_user_can_change_password(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {self.old_access}"
            ),
        )

        response = self.client.post(
            self.url,
            {
                "old_password": self.old_password,
                "new_password": self.new_password,
                "new_password_confirm": (
                    self.new_password
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn(
            "access",
            response.data,
        )
        self.assertIn(
            "refresh",
            response.data,
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                self.new_password,
            )
        )
        self.assertFalse(
            self.user.check_password(
                self.old_password,
            )
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {self.old_access}"
            ),
        )
        old_access_response = self.client.get(
            reverse("auth-me"),
        )

        self.assertEqual(
            old_access_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        self.client.credentials()
        old_refresh_response = self.client.post(
            reverse("auth-token-refresh"),
            {
                "refresh": self.old_refresh,
            },
            format="json",
        )

        self.assertEqual(
            old_refresh_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_old_password_must_be_correct(self):
        self.client.force_authenticate(
            user=self.user,
        )

        response = self.client.post(
            self.url,
            {
                "old_password": "IncorrectPassword123!",
                "new_password": self.new_password,
                "new_password_confirm": (
                    self.new_password
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "old_password",
            response.data,
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                self.old_password,
            )
        )

    def test_new_password_confirmation_must_match(
        self,
    ):
        self.client.force_authenticate(
            user=self.user,
        )

        response = self.client.post(
            self.url,
            {
                "old_password": self.old_password,
                "new_password": self.new_password,
                "new_password_confirm": (
                    "DifferentPassword789!"
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "new_password_confirm",
            response.data,
        )

    def test_new_password_must_be_different(self):
        self.client.force_authenticate(
            user=self.user,
        )

        response = self.client.post(
            self.url,
            {
                "old_password": self.old_password,
                "new_password": self.old_password,
                "new_password_confirm": (
                    self.old_password
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "new_password",
            response.data,
        )

    def test_weak_new_password_is_rejected(self):
        self.client.force_authenticate(
            user=self.user,
        )

        response = self.client.post(
            self.url,
            {
                "old_password": self.old_password,
                "new_password": "123",
                "new_password_confirm": "123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "new_password",
            response.data,
        )

    def test_user_can_login_with_new_password(self):
        self.client.force_authenticate(
            user=self.user,
        )

        change_response = self.client.post(
            self.url,
            {
                "old_password": self.old_password,
                "new_password": self.new_password,
                "new_password_confirm": (
                    self.new_password
                ),
            },
            format="json",
        )

        self.assertEqual(
            change_response.status_code,
            status.HTTP_200_OK,
        )

        self.client.force_authenticate(
            user=None,
        )

        old_login_response = self.client.post(
            self.login_url,
            {
                "username": self.user.username,
                "password": self.old_password,
            },
            format="json",
        )
        new_login_response = self.client.post(
            self.login_url,
            {
                "username": self.user.username,
                "password": self.new_password,
            },
            format="json",
        )

        self.assertEqual(
            old_login_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            new_login_response.status_code,
            status.HTTP_200_OK,
        )
