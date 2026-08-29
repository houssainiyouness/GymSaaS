from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from members.permissions import IsSuperAdminOrCoordinator

from .models import Gym
from .serializers import GymSerializer


class GymSettingsView(APIView):
    permission_classes = (
        IsSuperAdminOrCoordinator,
    )

    def get(self, request):
        gym = Gym.objects.first()

        if gym is None:
            return Response(
                {
                    "gym": None,
                },
                status=status.HTTP_200_OK,
            )

        serializer = GymSerializer(
            gym,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        gym = Gym.objects.first()

        serializer = GymSerializer(
            gym,
            data=request.data,
            partial=gym is not None,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        gym = serializer.save()

        return Response(
            GymSerializer(
                gym,
                context={
                    "request": request,
                },
            ).data,
            status=(
                status.HTTP_200_OK
                if gym
                else status.HTTP_201_CREATED
            ),
        )