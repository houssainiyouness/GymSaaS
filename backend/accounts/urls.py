from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

from .views import (
    ChangePasswordView,
    CurrentUserView,
    LoginView,
    LogoutView,
    RegisterView,
)


urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="auth-register",
    ),
    path(
        "login/",
        LoginView.as_view(),
        name="auth-login",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="auth-logout",
    ),
    path(
        "me/",
        CurrentUserView.as_view(),
        name="auth-me",
    ),
    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="auth-change-password",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="auth-token-refresh",
    ),
    path(
        "token/verify/",
        TokenVerifyView.as_view(),
        name="auth-token-verify",
    ),
]
