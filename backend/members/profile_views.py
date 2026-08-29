from django.shortcuts import get_object_or_404
from rest_framework import (
    permissions,
    status,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Member
from .profile_serializers import (
    MemberProfileUpdateSerializer,
)
from .serializers import MemberSerializer


class MemberProfileUpdateView(APIView):
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get_member(self, request):
        return get_object_or_404(
            Member.objects.select_related("user"),
            user=request.user,
        )

    def get(self, request):
        member = self.get_member(request)

        return Response(
            MemberSerializer(
                member,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        member = self.get_member(request)

        serializer = MemberProfileUpdateSerializer(
            member,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(
            raise_exception=True,
        )
        serializer.save()

        member.refresh_from_db()

        return Response(
            MemberSerializer(
                member,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_200_OK,
        )