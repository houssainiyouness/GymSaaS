from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)


class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = (
            "id",
            "name",
            "duration_days",
            "price",
            "description",
            "is_active",
        )
        read_only_fields = ("id",)

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "Le nom doit contenir au moins 2 caractères."
            )

        existing_plans = MembershipPlan.objects.filter(
            name__iexact=value,
        )

        if self.instance:
            existing_plans = existing_plans.exclude(
                pk=self.instance.pk,
            )

        if existing_plans.exists():
            raise serializers.ValidationError(
                "Une formule portant ce nom existe déjà."
            )

        return value

    def validate_duration_days(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "La durée doit être d’au moins un jour."
            )

        if value > 3650:
            raise serializers.ValidationError(
                "La durée ne peut pas dépasser 10 ans."
            )

        return value

    def validate_price(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(
                "Le prix doit être supérieur à zéro."
            )

        return value


class MemberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    class Meta:
        model = Member
        fields = (
            "id",
            "user",
            "username",
            "full_name",
            "email",
            "birth_date",
            "address",
            "emergency_phone",
            "qr_code",
            "joined_at",
            "is_active",
        )
        read_only_fields = (
            "qr_code",
            "joined_at",
        )

    def get_full_name(self, obj):
        return (
            obj.user.get_full_name()
            or obj.user.username
        )


class SubscriptionSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )
    days_remaining = serializers.IntegerField(
        read_only=True,
    )
    status = serializers.CharField(
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Subscription
        fields = (
            "id",
            "member",
            "member_name",
            "plan",
            "plan_name",
            "price_at_subscription",
            "start_date",
            "end_date",
            "days_remaining",
            "status",
            "status_display",
            "is_suspended",
            "created_at",
        )
        read_only_fields = (
            "id",
            "price_at_subscription",
            "end_date",
            "days_remaining",
            "status",
            "status_display",
            "created_at",
        )

    def get_member_name(self, obj):
        return (
            obj.member.user.get_full_name()
            or obj.member.user.username
        )

    def validate(self, attrs):
        member = attrs.get(
            "member",
            getattr(
                self.instance,
                "member",
                None,
            ),
        )
        plan = attrs.get(
            "plan",
            getattr(
                self.instance,
                "plan",
                None,
            ),
        )
        start_date = attrs.get(
            "start_date",
            getattr(
                self.instance,
                "start_date",
                timezone.localdate(),
            ),
        )

        errors = {}

        if member and not member.is_active:
            errors["member"] = (
                "Impossible d’abonner un membre inactif."
            )

        if plan and not plan.is_active:
            errors["plan"] = (
                "Cette formule d’abonnement est inactive."
            )

        if self.instance is None and member and plan:
            end_date = start_date + timedelta(
                days=plan.duration_days,
            )

            overlapping = Subscription.objects.filter(
                member=member,
                is_suspended=False,
                start_date__lte=end_date,
                end_date__gte=start_date,
            ).exists()

            if overlapping:
                errors["member"] = (
                    "Ce membre possède déjà un abonnement "
                    "pendant cette période."
                )

        if errors:
            raise serializers.ValidationError(
                errors,
            )

        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="subscription.member.user.get_full_name",
        read_only=True,
    )
    plan_name = serializers.CharField(
        source="subscription.plan.name",
        read_only=True,
    )
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = (
            "id",
            "subscription",
            "member_name",
            "plan_name",
            "amount",
            "remaining_amount",
            "method",
            "paid_at",
            "reference",
            "notes",
        )
        read_only_fields = (
            "id",
            "member_name",
            "plan_name",
            "remaining_amount",
        )

    def validate(self, attrs):
        subscription = attrs.get(
            "subscription",
            getattr(
                self.instance,
                "subscription",
                None,
            ),
        )
        amount = attrs.get(
            "amount",
            getattr(
                self.instance,
                "amount",
                None,
            ),
        )

        errors = {}

        if (
            amount is not None
            and amount <= Decimal("0.00")
        ):
            errors["amount"] = (
                "Le montant doit être supérieur à zéro."
            )

        if (
            subscription
            and amount
            and amount > Decimal("0.00")
        ):
            payments = Payment.objects.filter(
                subscription=subscription,
            )

            if self.instance:
                payments = payments.exclude(
                    pk=self.instance.pk,
                )

            already_paid = payments.aggregate(
                total=Sum("amount"),
            )["total"] or Decimal("0.00")

            if (
                already_paid + amount
                > subscription.price_at_subscription
            ):
                errors["amount"] = (
                    "Le total des paiements ne peut pas "
                    "dépasser le prix de la formule."
                )

        if errors:
            raise serializers.ValidationError(
                errors,
            )

        return attrs

    def get_remaining_amount(self, obj):
        total_paid = (
            obj.subscription.payments.aggregate(
                total=Sum("amount"),
            )["total"]
            or Decimal("0.00")
        )

        remaining = (
            obj.subscription.price_at_subscription
            - total_paid
        )

        return max(
            remaining,
            Decimal("0.00"),
        )
