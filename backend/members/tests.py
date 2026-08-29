from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Member, MembershipPlan, Payment, Subscription


User = get_user_model()


class MembersPermissionsTests(APITestCase):
    def setUp(self):
        self.member_user = User.objects.create_user(
            username="member1",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.member = Member.objects.create(
            user=self.member_user,
        )

        self.other_user = User.objects.create_user(
            username="member2",
            password="TestPassword123!",
            role=User.Role.MEMBER,
        )
        self.other_member = Member.objects.create(
            user=self.other_user,
        )

        self.coordinator = User.objects.create_user(
            username="coordinator",
            password="TestPassword123!",
            role=User.Role.COORDINATOR,
        )

        self.plan = MembershipPlan.objects.create(
            name="Mensuel",
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

    def test_anonymous_user_cannot_access_members(self):
        response = self.client.get(reverse("member-list"))

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_member_sees_only_own_profile(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(reverse("member-list"))

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.member.id,
        )

    def test_member_cannot_access_another_profile(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            reverse(
                "member-detail",
                kwargs={"pk": self.other_member.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_member_sees_only_own_subscription(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.get(
            reverse("subscription-list"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.subscription.id,
        )

    def test_member_cannot_create_plan(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.post(
            reverse("plan-list"),
            {
                "name": "Annuel",
                "duration_days": 365,
                "price": "2500.00",
                "description": "",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_coordinator_sees_all_members(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(reverse("member-list"))

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 2)

    def test_coordinator_can_create_plan(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("plan-list"),
            {
                "name": "Annuel",
                "duration_days": 365,
                "price": "2500.00",
                "description": "",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_plan_duration_must_be_positive(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("plan-list"),
            {
                "name": "Formule invalide",
                "duration_days": 0,
                "price": "300.00",
                "description": "",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("duration_days", response.data)

    def test_plan_price_must_be_positive(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("plan-list"),
            {
                "name": "Formule gratuite",
                "duration_days": 30,
                "price": "0.00",
                "description": "",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("price", response.data)

    def test_plan_name_must_be_unique(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("plan-list"),
            {
                "name": "mensuel",
                "duration_days": 60,
                "price": "500.00",
                "description": "",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("name", response.data)

    def test_cannot_subscribe_inactive_member(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        self.other_member.is_active = False
        self.other_member.save()

        response = self.client.post(
            reverse("subscription-list"),
            {
                "member": self.other_member.id,
                "plan": self.plan.id,
                "start_date": "2026-09-01",
                "is_suspended": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("member", response.data)

    def test_cannot_use_inactive_plan(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        self.plan.is_active = False
        self.plan.save()

        response = self.client.post(
            reverse("subscription-list"),
            {
                "member": self.other_member.id,
                "plan": self.plan.id,
                "start_date": "2026-09-01",
                "is_suspended": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("plan", response.data)

    def test_cannot_create_overlapping_subscription(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("subscription-list"),
            {
                "member": self.member.id,
                "plan": self.plan.id,
                "start_date": str(
                    self.subscription.start_date
                ),
                "is_suspended": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("member", response.data)

    def test_coordinator_can_create_partial_payment(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("payment-list"),
            {
                "subscription": self.subscription.id,
                "amount": "100.00",
                "method": Payment.Method.CASH,
                "reference": "PAY-001",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(
            response.data["remaining_amount"],
            Decimal("200.00"),
        )

    def test_payment_amount_must_be_positive(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("payment-list"),
            {
                "subscription": self.subscription.id,
                "amount": "0.00",
                "method": Payment.Method.CASH,
                "reference": "",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("amount", response.data)
        self.assertEqual(Payment.objects.count(), 0)

    def test_payments_cannot_exceed_plan_price(self):
        Payment.objects.create(
            subscription=self.subscription,
            amount="100.00",
            method=Payment.Method.CASH,
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("payment-list"),
            {
                "subscription": self.subscription.id,
                "amount": "250.00",
                "method": Payment.Method.CARD,
                "reference": "PAY-002",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("amount", response.data)
        self.assertEqual(Payment.objects.count(), 1)

    def test_member_cannot_create_payment(self):
        self.client.force_authenticate(
            user=self.member_user,
        )

        response = self.client.post(
            reverse("payment-list"),
            {
                "subscription": self.subscription.id,
                "amount": "100.00",
                "method": Payment.Method.CASH,
                "reference": "",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(Payment.objects.count(), 0)
    def test_coordinator_can_search_plans(self):
        MembershipPlan.objects.create(
            name="Annuel Premium",
            duration_days=365,
            price="2500.00",
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            reverse("plan-list"),
            {"search": "Premium"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["name"],
            "Annuel Premium",
        )

    def test_plans_can_be_ordered_by_price(self):
        MembershipPlan.objects.create(
            name="Hebdomadaire",
            duration_days=7,
            price="100.00",
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            reverse("plan-list"),
            {"ordering": "price"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data[0]["name"],
            "Hebdomadaire",
        )

    def test_coordinator_can_search_payments_by_reference(self):
        Payment.objects.create(
            subscription=self.subscription,
            amount="100.00",
            method=Payment.Method.CASH,
            reference="PAY-SEARCH-001",
        )
        Payment.objects.create(
            subscription=self.subscription,
            amount="50.00",
            method=Payment.Method.CARD,
            reference="AUTRE-REFERENCE",
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            reverse("payment-list"),
            {"search": "PAY-SEARCH-001"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["reference"],
            "PAY-SEARCH-001",
        )

    def test_subscription_price_is_copied_from_plan(self):
        self.assertEqual(
            self.subscription.price_at_subscription,
            Decimal("300.00"),
        )

        self.plan.price = Decimal("450.00")
        self.plan.save(
            update_fields=(
                "price",
            ),
        )
        self.subscription.refresh_from_db()

        self.assertEqual(
            self.subscription.price_at_subscription,
            Decimal("300.00"),
        )

    def test_subscription_api_ignores_submitted_price(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("subscription-list"),
            {
                "member": self.other_member.id,
                "plan": self.plan.id,
                "start_date": "2027-01-01",
                "is_suspended": False,
                "price_at_subscription": "1.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            response.data["price_at_subscription"],
            "300.00",
        )

    def test_payment_limit_uses_historical_price(self):
        self.plan.price = Decimal("50.00")
        self.plan.save(
            update_fields=(
                "price",
            ),
        )
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.post(
            reverse("payment-list"),
            {
                "subscription": self.subscription.id,
                "amount": "250.00",
                "method": Payment.Method.CASH,
                "reference": "HISTORICAL-PRICE",
                "notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            response.data["remaining_amount"],
            Decimal("50.00"),
        )

    def test_coordinator_can_search_members(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.get(
            reverse("member-list"),
            {
                "search": "member1",
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
            self.member.id,
        )

    def test_deactivating_member_deactivates_user(self):
        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.patch(
            reverse(
                "member-detail",
                kwargs={
                    "pk": self.member.pk,
                },
            ),
            {
                "is_active": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.member.refresh_from_db()
        self.member_user.refresh_from_db()

        self.assertFalse(self.member.is_active)
        self.assertFalse(self.member_user.is_active)

    def test_deleting_member_deletes_user_account(self):
        user_id = self.other_user.pk

        self.client.force_authenticate(
            user=self.coordinator,
        )

        response = self.client.delete(
            reverse(
                "member-detail",
                kwargs={
                    "pk": self.other_member.pk,
                },
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertFalse(
            User.objects.filter(
                pk=user_id,
            ).exists()
        )
