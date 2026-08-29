from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    CoachViewSet,
    CourseViewSet,
)


router = DefaultRouter()

router.register(
    "coaches",
    CoachViewSet,
    basename="coach",
)

router.register(
    "courses",
    CourseViewSet,
    basename="course",
)


urlpatterns = router.urls