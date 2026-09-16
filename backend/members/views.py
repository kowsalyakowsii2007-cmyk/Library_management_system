from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Member
from .serializers import MemberSerializer

class MemberListCreateView(APIView):
    """
    GET /api/members/ - List all members with optional search by name or email.
    POST /api/members/ - Create a new member.
    """
    def get(self, request):
        queryset = Member.objects.all()

        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(department__icontains=search_query)
            )

        name = request.query_params.get('name', '').strip()
        if name:
            queryset = queryset.filter(name__icontains=name)

        email = request.query_params.get('email', '').strip()
        if email:
            queryset = queryset.filter(email__icontains=email)

        department = request.query_params.get('department', '').strip()
        if department and department.lower() != 'all':
            queryset = queryset.filter(department__iexact=department)

        serializer = MemberSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = MemberSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Member registered successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                "message": "Validation failed while registering member.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class MemberDetailView(APIView):
    """
    GET /api/members/{id}/ - Retrieve single member.
    PUT /api/members/{id}/ - Update member.
    PATCH /api/members/{id}/ - Partial update member.
    DELETE /api/members/{id}/ - Delete member (Blocked if active issues exist).
    """
    def get_object(self, pk):
        try:
            return Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return None

    def get(self, request, pk):
        member = self.get_object(pk)
        if not member:
            return Response(
                {"error": f"Member with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = MemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        member = self.get_object(pk)
        if not member:
            return Response(
                {"error": f"Member with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = MemberSerializer(member, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Member updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "message": "Validation failed while updating member.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, pk):
        member = self.get_object(pk)
        if not member:
            return Response(
                {"error": f"Member with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = MemberSerializer(member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Member updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "message": "Validation failed while updating member.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        member = self.get_object(pk)
        if not member:
            return Response(
                {"error": f"Member with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # DELETE BUSINESS RULE:
        # Check whether this member has any active Issue record (status = 'Issued')
        active_issues_count = member.issues.filter(status='Issued').count()
        if active_issues_count > 0:
            return Response(
                {
                    "error": "Cannot delete this member — they currently have an active issued book record.",
                    "active_issues_count": active_issues_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        member_name = member.name
        member.delete()
        return Response(
            {"message": f"Member '{member_name}' deleted successfully."},
            status=status.HTTP_200_OK
        )
