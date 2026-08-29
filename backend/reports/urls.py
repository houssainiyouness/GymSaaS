from django.urls import path

from .export_views import (
    AttendancesCSVExportView,
    MembersCSVExportView,
    PaymentsCSVExportView,
)
from .views import FinancialReportView


urlpatterns = [
    path(
        "financial/",
        FinancialReportView.as_view(),
        name="financial-report",
    ),
    path(
        "exports/members.csv",
        MembersCSVExportView.as_view(),
        name="members-csv-export",
    ),
    path(
        "exports/payments.csv",
        PaymentsCSVExportView.as_view(),
        name="payments-csv-export",
    ),
    path(
        "exports/attendances.csv",
        AttendancesCSVExportView.as_view(),
        name="attendances-csv-export",
    ),
]