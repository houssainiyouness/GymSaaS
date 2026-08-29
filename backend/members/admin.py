from django.contrib import admin

from .models import Member, MembershipPlan, Payment, Subscription


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("user", "is_active", "joined_at")
    list_filter = ("is_active",)
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
    )
    readonly_fields = ("joined_at",)


@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "duration_days", "price", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "plan",
        "price_at_subscription",
        "start_date",
        "end_date",
        "display_days_remaining",
        "display_status",
    )
    list_filter = ("plan", "is_suspended", "start_date", "end_date")
    search_fields = (
        "member__user__username",
        "member__user__first_name",
        "member__user__last_name",
    )
    readonly_fields = (
        "price_at_subscription",
        "created_at",
        "display_days_remaining",
        "display_status",
    )

    @admin.display(description="Jours restants")
    def display_days_remaining(self, obj):
        return obj.days_remaining

    @admin.display(description="Statut")
    def display_status(self, obj):
        return obj.get_status_display()


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "subscription",
        "amount",
        "method",
        "paid_at",
        "reference",
    )
    list_filter = ("method", "paid_at")
    search_fields = (
        "subscription__member__user__username",
        "subscription__member__user__first_name",
        "subscription__member__user__last_name",
        "reference",
    )
