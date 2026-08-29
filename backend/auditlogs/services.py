import json

from django.core.serializers.json import (
    DjangoJSONEncoder,
)

from .models import AuditLog


def get_client_ip(request):
    if request is None:
        return None

    forwarded_for = request.META.get(
        "HTTP_X_FORWARDED_FOR",
    )

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get(
        "REMOTE_ADDR",
    )


def normalize_metadata(metadata):
    if not metadata:
        return {}

    return json.loads(
        json.dumps(
            metadata,
            cls=DjangoJSONEncoder,
        )
    )


def create_audit_log(
    *,
    request,
    action,
    actor=None,
    entity=None,
    entity_type="",
    entity_id="",
    description="",
    metadata=None,
):
    if (
        actor is None
        and request is not None
        and request.user.is_authenticated
    ):
        actor = request.user

    if entity is not None:
        entity_type = entity._meta.label
        entity_id = str(
            entity.pk,
        )

    return AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        metadata=normalize_metadata(
            metadata,
        ),
        ip_address=get_client_ip(
            request,
        ),
    )