from django.urls import path
from rest_framework.routers import DefaultRouter

from .admin_views import AdminMemberCreateView
from .alert_views import (
    PaymentAlertsView,
    SubscriptionAlertsView,
)
from .portal_views import (
    MemberAttendancesView,
    MemberPaymentsView,
    MemberQRCodeView,
    MemberSubscriptionView,
)
from .profile_views import MemberProfileUpdateView
from .views import (
    MemberMeView,
    MemberViewSet,
    MembershipPlanViewSet,
    PaymentViewSet,
    SubscriptionViewSet,
)


router = DefaultRouter()

router.register(
    "members",
    MemberViewSet,
    basename="member",
)
router.register(
    "plans",
    MembershipPlanViewSet,
    basename="plan",
)
router.register(
    "subscriptions",
    SubscriptionViewSet,
    basename="subscription",
)
router.register(
    "payments",
    PaymentViewSet,
    basename="payment",
)


urlpatterns = [
    path(
        "me/",
        MemberMeView.as_view(),
        name="member-me",
    ),
    path(
        "me/profile/",
        MemberProfileUpdateView.as_view(),
        name="member-profile-update",
    ),
    path(
        "me/subscription/",
        MemberSubscriptionView.as_view(),
        name="member-subscription",
    ),
    path(
        "me/payments/",
        MemberPaymentsView.as_view(),
        name="member-payments",
    ),
    path(
        "me/attendances/",
        MemberAttendancesView.as_view(),
        name="member-attendances",
    ),
    path(
        "me/qr-code/",
        MemberQRCodeView.as_view(),
        name="member-qr-code",
    ),
    path(
        "members/admin-create/",
        AdminMemberCreateView.as_view(),
        name="admin-member-create",
    ),
    path(
        "alerts/subscriptions/",
        SubscriptionAlertsView.as_view(),
        name="subscription-alerts",
    ),
    path(
        "alerts/payments/",
        PaymentAlertsView.as_view(),
        name="payment-alerts",
    ),
    *router.urls,
]