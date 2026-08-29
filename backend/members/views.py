from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import (
    filters,
    permissions,
    viewsets,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from auditlogs.models import AuditLog
from auditlogs.services import create_audit_log

from .models import (
    Member,
    MembershipPlan,
    Payment,
    Subscription,
)
from .permissions import (
    IsManagerOrReadOnly,
    IsSuperAdminOrCoordinator,
)
from .serializers import (
    MemberSerializer,
    MembershipPlanSerializer,
    PaymentSerializer,
    SubscriptionSerializer,
)


def is_manager(user):
    return (
        user.is_superuser
        or user.role in (
            "SUPER_ADMIN",
            "COORDINATOR",
        )
    )


class MemberMeView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get(self, request):
        member = get_object_or_404(
            Member.objects.select_related("user"),
            user=request.user,
        )

        serializer = MemberSerializer(
            member,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
        )


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    permission_classes = (
        permissions.IsAuthenticated,
    )
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "user__phone",
        "emergency_phone",
        "address",
    )
    ordering_fields = (
        "joined_at",
        "birth_date",
        "is_active",
    )
    ordering = ("-joined_at",)

    def get_queryset(self):
        queryset = Member.objects.select_related(
            "user",
        ).all()

        if is_manager(self.request.user):
            return queryset

        return queryset.filter(
            user=self.request.user,
        )

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
        ):
            return [
                IsSuperAdminOrCoordinator(),
            ]

        return [
            permissions.IsAuthenticated(),
        ]

    def perform_create(self, serializer):
        member = serializer.save()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.CREATE,
            entity=member,
            description="Création d’un membre.",
            metadata={
                "username": member.user.username,
                "email": member.user.email,
            },
        )

    def perform_update(self, serializer):
        was_active = serializer.instance.is_active
        member = serializer.save()

        if member.user.is_active != member.is_active:
            member.user.is_active = member.is_active
            member.user.save(
                update_fields=(
                    "is_active",
                ),
            )

        action = AuditLog.Action.UPDATE

        if was_active and not member.is_active:
            action = AuditLog.Action.DEACTIVATE
        elif not was_active and member.is_active:
            action = AuditLog.Action.ACTIVATE

        create_audit_log(
            request=self.request,
            action=action,
            entity=member,
            description="Modification d’un membre.",
            metadata={
                "username": member.user.username,
                "is_active": member.is_active,
            },
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        entity_id = str(instance.pk)
        username = instance.user.username
        user = instance.user

        user.delete()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.DELETE,
            entity_type="members.Member",
            entity_id=entity_id,
            description="Suppression d’un membre.",
            metadata={
                "username": username,
            },
        )


class MembershipPlanViewSet(viewsets.ModelViewSet):
    queryset = MembershipPlan.objects.all()
    serializer_class = MembershipPlanSerializer
    permission_classes = (
        IsManagerOrReadOnly,
    )
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    search_fields = (
        "name",
        "description",
    )
    ordering_fields = (
        "name",
        "duration_days",
        "price",
        "is_active",
    )
    ordering = ("price",)

    def perform_create(self, serializer):
        plan = serializer.save()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.CREATE,
            entity=plan,
            description=(
                "Création d’une formule d’abonnement."
            ),
            metadata={
                "name": plan.name,
                "duration_days": plan.duration_days,
                "price": plan.price,
            },
        )

    def perform_update(self, serializer):
        was_active = serializer.instance.is_active
        plan = serializer.save()

        action = AuditLog.Action.UPDATE

        if was_active and not plan.is_active:
            action = AuditLog.Action.DEACTIVATE
        elif not was_active and plan.is_active:
            action = AuditLog.Action.ACTIVATE

        create_audit_log(
            request=self.request,
            action=action,
            entity=plan,
            description=(
                "Modification d’une formule "
                "d’abonnement."
            ),
            metadata={
                "name": plan.name,
                "duration_days": plan.duration_days,
                "price": plan.price,
                "is_active": plan.is_active,
            },
        )

    def perform_destroy(self, instance):
        entity_id = str(instance.pk)
        name = instance.name

        instance.delete()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.DELETE,
            entity_type="members.MembershipPlan",
            entity_id=entity_id,
            description=(
                "Suppression d’une formule "
                "d’abonnement."
            ),
            metadata={
                "name": name,
            },
        )


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = (
        permissions.IsAuthenticated,
    )
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    search_fields = (
        "member__user__username",
        "member__user__first_name",
        "member__user__last_name",
        "member__user__email",
        "plan__name",
    )
    ordering_fields = (
        "start_date",
        "end_date",
        "created_at",
        "is_suspended",
    )
    ordering = ("-start_date",)

    def get_queryset(self):
        queryset = Subscription.objects.select_related(
            "member__user",
            "plan",
        ).all()

        if is_manager(self.request.user):
            return queryset

        return queryset.filter(
            member__user=self.request.user,
        )

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
        ):
            return [
                IsSuperAdminOrCoordinator(),
            ]

        return [
            permissions.IsAuthenticated(),
        ]

    def perform_create(self, serializer):
        subscription = serializer.save()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.CREATE,
            entity=subscription,
            description="Création d’un abonnement.",
            metadata={
                "member_id": subscription.member_id,
                "member_name": str(
                    subscription.member,
                ),
                "plan_id": subscription.plan_id,
                "plan_name": subscription.plan.name,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
            },
        )

    def perform_update(self, serializer):
        was_suspended = (
            serializer.instance.is_suspended
        )
        subscription = serializer.save()

        action = AuditLog.Action.UPDATE

        if (
            not was_suspended
            and subscription.is_suspended
        ):
            action = AuditLog.Action.SUSPEND
        elif (
            was_suspended
            and not subscription.is_suspended
        ):
            action = AuditLog.Action.ACTIVATE

        create_audit_log(
            request=self.request,
            action=action,
            entity=subscription,
            description="Modification d’un abonnement.",
            metadata={
                "member_id": subscription.member_id,
                "plan_id": subscription.plan_id,
                "is_suspended": (
                    subscription.is_suspended
                ),
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
            },
        )

    def perform_destroy(self, instance):
        entity_id = str(instance.pk)
        member_id = instance.member_id
        plan_id = instance.plan_id

        instance.delete()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.DELETE,
            entity_type="members.Subscription",
            entity_id=entity_id,
            description="Suppression d’un abonnement.",
            metadata={
                "member_id": member_id,
                "plan_id": plan_id,
            },
        )


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = (
        permissions.IsAuthenticated,
    )
    filter_backends = (
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    search_fields = (
        "reference",
        "notes",
        "subscription__member__user__username",
        "subscription__member__user__first_name",
        "subscription__member__user__last_name",
        "subscription__plan__name",
    )
    ordering_fields = (
        "amount",
        "paid_at",
        "method",
    )
    ordering = ("-paid_at",)

    def get_queryset(self):
        queryset = Payment.objects.select_related(
            "subscription__member__user",
            "subscription__plan",
        ).all()

        if is_manager(self.request.user):
            return queryset

        return queryset.filter(
            subscription__member__user=self.request.user,
        )

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
        ):
            return [
                IsSuperAdminOrCoordinator(),
            ]

        return [
            permissions.IsAuthenticated(),
        ]

    def perform_create(self, serializer):
        payment = serializer.save()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.PAYMENT,
            entity=payment,
            description="Enregistrement d’un paiement.",
            metadata={
                "subscription_id": (
                    payment.subscription_id
                ),
                "member_id": (
                    payment.subscription.member_id
                ),
                "amount": payment.amount,
                "method": payment.method,
                "reference": payment.reference,
            },
        )

    def perform_update(self, serializer):
        payment = serializer.save()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.UPDATE,
            entity=payment,
            description="Modification d’un paiement.",
            metadata={
                "subscription_id": (
                    payment.subscription_id
                ),
                "amount": payment.amount,
                "method": payment.method,
                "reference": payment.reference,
            },
        )

    def perform_destroy(self, instance):
        entity_id = str(instance.pk)
        subscription_id = instance.subscription_id
        amount = instance.amount
        reference = instance.reference

        instance.delete()

        create_audit_log(
            request=self.request,
            action=AuditLog.Action.DELETE,
            entity_type="members.Payment",
            entity_id=entity_id,
            description="Suppression d’un paiement.",
            metadata={
                "subscription_id": subscription_id,
                "amount": amount,
                "reference": reference,
            },
        )
