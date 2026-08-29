from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "actor",
        "action",
        "entity_type",
        "entity_id",
        "ip_address",
    )
    list_filter = (
        "action",
        "entity_type",
        "created_at",
    )
    search_fields = (
        "actor__username",
        "actor__first_name",
        "actor__last_name",
        "entity_type",
        "entity_id",
        "description",
    )
    ordering = (
        "-created_at",
    )
    readonly_fields = (
        "actor",
        "action",
        "entity_type",
        "entity_id",
        "description",
        "metadata",
        "ip_address",
        "created_at",
    )

    def has_add_permission(
        self,
        request,
    ):
        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False