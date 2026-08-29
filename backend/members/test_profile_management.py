from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Member


User = get_user_model()


class MemberProfileManagementTests(APITestCase):
    def setUp(self):
        self.member_user = User.objects.create_user(
            username="profile-member",
            email="profile-member@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
            first_name="Ancien",
            last_name="Nom",
            phone="0600000000",
        )
        self.member = Member.objects.create(
            user=self.member_user,
            address="Ancienne adresse",
            emergency_phone="0611111111",
        )

        self.other_user = User.objects.create_user(
            username="other-profile-member",
            email="other-profile@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )
        self.other_member = Member.objects.create(
            user=self.other_user,
        )

        self.user_without_profile = User.objects.create_user(
            username="profileless-user",
            email="profileless@test.com",
            password="StrongPassword123!",
            role=User.Role.MEMBER,
        )

        self.url = reverse(
            "member-profile-update",
        )

    def test_anonymous_user_cannot_access_profile(
        self,
    ):
        response = self.client.get(
            self.url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_member_can_get_own_profile(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            self.url,
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

    def test_member_can_update_own_profile(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.patch(
            self.url,
            {
                "first_name": "Nouveau",
                "last_name": "Membre",
                "email": "updated-profile@test.com",
                "phone": "0622222222",
                "preferred_language": "ar",
                "birth_date": "2000-01-15",
                "address": "Nouvelle adresse",
                "emergency_phone": "0633333333",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.member_user.refresh_from_db()
        self.member.refresh_from_db()

        self.assertEqual(
            self.member_user.first_name,
            "Nouveau",
        )
        self.assertEqual(
            self.member_user.last_name,
            "Membre",
        )
        self.assertEqual(
            self.member_user.email,
            "updated-profile@test.com",
        )
        self.assertEqual(
            self.member_user.phone,
            "0622222222",
        )
        self.assertEqual(
            self.member_user.preferred_language,
            "ar",
        )
        self.assertEqual(
            self.member.address,
            "Nouvelle adresse",
        )
        self.assertEqual(
            self.member.emergency_phone,
            "0633333333",
        )
        self.assertEqual(
            str(self.member.birth_date),
            "2000-01-15",
        )

    def test_duplicate_email_is_rejected(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.patch(
            self.url,
            {
                "email": self.other_user.email,
            },
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

        self.member_user.refresh_from_db()

        self.assertEqual(
            self.member_user.email,
            "profile-member@test.com",
        )

    def test_member_cannot_modify_protected_fields(
        self,
    ):
        original_qr_code = self.member.qr_code

        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.patch(
            self.url,
            {
                "role": User.Role.SUPER_ADMIN,
                "is_active": False,
                "qr_code": (
                    "00000000-0000-0000-0000-000000000000"
                ),
                "username": "modified-username",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.member_user.refresh_from_db()
        self.member.refresh_from_db()

        self.assertEqual(
            self.member_user.role,
            User.Role.MEMBER,
        )
        self.assertEqual(
            self.member_user.username,
            "profile-member",
        )
        self.assertTrue(
            self.member_user.is_active,
        )
        self.assertTrue(
            self.member.is_active,
        )
        self.assertEqual(
            self.member.qr_code,
            original_qr_code,
        )

    def test_user_without_profile_receives_404(self):
        self.client.force_authenticate(
            user=self.user_without_profile,
        )

        response = self.client.patch(
            self.url,
            {
                "address": "Nouvelle adresse",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )