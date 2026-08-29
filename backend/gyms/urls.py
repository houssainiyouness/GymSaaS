from django.urls import path

from .views import GymSettingsView


urlpatterns = [
    path(
        "",
        GymSettingsView.as_view(),
        name="gym-settings",
    ),
]