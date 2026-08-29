from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "gymsaas-api",
        }
    )


urlpatterns = [
    path(
        "health/",
        health_check,
        name="health-check",
    ),
    path(
        "admin/",
        admin.site.urls,
    ),
    path(
        "api/auth/",
        include("accounts.urls"),
    ),
    path(
        "api/contacts/",
        include("contacts.urls"),
    ),
    path(
        "api/dashboard/",
        include("dashboard.urls"),
    ),
    path(
        "api/attendances/",
        include("attendances.urls"),
    ),
    path(
        "api/reports/",
        include("reports.urls"),
    ),
    path(
        "api/audit-logs/",
        include("auditlogs.urls"),
    ),

    # Paramètres de la salle
    path(
        "api/gym/",
        include("gyms.urls"),
    ),

    # Coachs et cours
    path(
        "api/",
        include("courses.urls"),
    ),

    # Membres, formules, abonnements et paiements
    path(
        "api/",
        include("members.urls"),
    ),

    path(
        "api-auth/",
        include("rest_framework.urls"),
    ),
    path(
    "api/",
    include("courses.urls"),
),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )