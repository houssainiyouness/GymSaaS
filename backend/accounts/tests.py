from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.password = "TestPassword123!"
        self.user = User.objects.create_user(
            username="testuser",
            password=self.password,
            email="test@example.com",
            role=User.Role.MEMBER,
        )

    def test_login_returns_jwt_pair_and_user(self):
        response = self.client.post(
            reverse("auth-login"),
            {
                "username": self.user.username,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(
            response.data["user"]["username"],
            self.user.username,
        )
        self.assertEqual(
            response.data["user"]["role"],
            User.Role.MEMBER,
        )

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse("auth-login"),
            {
                "username": self.user.username,
                "password": "incorrect-password",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_current_user_requires_authentication(self):
        response = self.client.get(reverse("auth-me"))

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_read_profile(self):
        login_response = self.client.post(
            reverse("auth-login"),
            {
                "username": self.user.username,
                "password": self.password,
            },
            format="json",
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {login_response.data['access']}"
            ),
        )

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)

    def test_refresh_token_creates_new_access_token(self):
        login_response = self.client.post(
            reverse("auth-login"),
            {
                "username": self.user.username,
                "password": self.password,
            },
            format="json",
        )

        response = self.client.post(
            reverse("auth-token-refresh"),
            {
                "refresh": login_response.data[
                    "refresh"
                ],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_logout_blacklists_refresh_token(self):
        login_response = self.client.post(
            reverse("auth-login"),
            {
                "username": self.user.username,
                "password": self.password,
            },
            format="json",
        )
        access = login_response.data["access"]
        refresh = login_response.data["refresh"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access}",
        )
        logout_response = self.client.post(
            reverse("auth-logout"),
            {
                "refresh": refresh,
            },
            format="json",
        )

        self.assertEqual(
            logout_response.status_code,
            status.HTTP_200_OK,
        )

        self.client.credentials()
        refresh_response = self.client.post(
            reverse("auth-token-refresh"),
            {
                "refresh": refresh,
            },
            format="json",
        )

        self.assertEqual(
            refresh_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_legacy_token_header_is_rejected(self):
        response = self.client.get(
            reverse("auth-me"),
            HTTP_AUTHORIZATION="Token ancien-token",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
