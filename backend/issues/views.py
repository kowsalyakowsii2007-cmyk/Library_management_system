from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum
from .models import Issue
from .serializers import IssueSerializer
from books.models import Book
from members.models import Member

class IssueListCreateView(APIView):
    """
    GET /api/issues/ - List all issues with optional filtering (status, search).
    POST /api/issues/ - Issue a book to a member (decrements book available_quantity).
    """
    def get(self, request):
        queryset = Issue.objects.select_related('book', 'member').all()

        # Status filter ('Issued' or 'Returned')
        status_param = request.query_params.get('status', '').strip()
        if status_param and status_param.lower() != 'all':
            queryset = queryset.filter(status__iexact=status_param)

        # Search across book title, ISBN, member name, member email
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(book__title__icontains=search_query) |
                Q(book__isbn__icontains=search_query) |
                Q(member__name__icontains=search_query) |
                Q(member__email__icontains=search_query)
            )

        # Specific filters
        book_id = request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)

        member_id = request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)

        serializer = IssueSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = IssueSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation failed while creating issue record.",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        book = validated_data['book']
        member = validated_data['member']

        # Atomic transaction: verify availability and decrement count
        with transaction.atomic():
            # Refresh lock on book
            locked_book = Book.objects.select_for_update().get(pk=book.pk)
            if locked_book.available_quantity <= 0:
                return Response(
                    {
                        "error": f"Cannot issue book '{locked_book.title}': No available copies left in the library."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decrement available_quantity by 1
            locked_book.available_quantity -= 1
            locked_book.save()

            issue_instance = serializer.save(book=locked_book, status=Issue.STATUS_ISSUED)

        output_serializer = IssueSerializer(issue_instance)
        return Response(
            {
                "message": f"Book '{locked_book.title}' successfully issued to '{member.name}'.",
                "data": output_serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class IssueDetailView(APIView):
    """
    GET /api/issues/{id}/ - Retrieve single issue record.
    PUT /api/issues/{id}/ - Update issue details.
    PATCH /api/issues/{id}/ - Partial update.
    DELETE /api/issues/{id}/ - Delete issue record.
    """
    def get_object(self, pk):
        try:
            return Issue.objects.select_related('book', 'member').get(pk=pk)
        except Issue.DoesNotExist:
            return None

    def get(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response(
                {"error": f"Issue record with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = IssueSerializer(issue)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response(
                {"error": f"Issue record with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = IssueSerializer(issue, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Issue record updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "message": "Validation failed while updating issue record.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response(
                {"error": f"Issue record with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = IssueSerializer(issue, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Issue record updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "message": "Validation failed while updating issue record.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        issue = self.get_object(pk)
        if not issue:
            return Response(
                {"error": f"Issue record with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            # If the record was still marked 'Issued', restoring the book's available count
            if issue.status == Issue.STATUS_ISSUED:
                book = Book.objects.select_for_update().get(pk=issue.book_id)
                if book.available_quantity < book.quantity:
                    book.available_quantity += 1
                    book.save()

            issue_id = issue.id
            issue.delete()

        return Response(
            {"message": f"Issue record #{issue_id} deleted successfully."},
            status=status.HTTP_200_OK
        )


class ReturnBookView(APIView):
    """
    PATCH /api/issues/{id}/return/ (or POST)
    Marks the issued book as Returned, records return_date, and increments available_quantity by 1.
    """
    def patch(self, request, pk):
        return self._handle_return(request, pk)

    def post(self, request, pk):
        return self._handle_return(request, pk)

    def _handle_return(self, request, pk):
        try:
            issue = Issue.objects.select_related('book', 'member').get(pk=pk)
        except Issue.DoesNotExist:
            return Response(
                {"error": f"Issue record with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        if issue.status == Issue.STATUS_RETURNED:
            return Response(
                {
                    "error": f"Cannot return: Book '{issue.book.title}' was already returned on {issue.return_date}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        custom_return_date = request.data.get('return_date')
        if custom_return_date:
            try:
                parsed_return_date = timezone.datetime.strptime(custom_return_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid return_date format. Please use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if parsed_return_date < issue.issue_date:
                return Response(
                    {"error": "Return date cannot be earlier than the issue date."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            actual_return_date = parsed_return_date
        else:
            actual_return_date = timezone.now().date()

        with transaction.atomic():
            # Update Issue status and return_date
            issue.status = Issue.STATUS_RETURNED
            issue.return_date = actual_return_date
            issue.save()

            # Increment available_quantity for the book, capped at total quantity
            book = Book.objects.select_for_update().get(pk=issue.book_id)
            if book.available_quantity < book.quantity:
                book.available_quantity += 1
                book.save()

        output_serializer = IssueSerializer(issue)
        return Response(
            {
                "message": f"Book '{issue.book.title}' successfully returned by '{issue.member.name}'.",
                "data": output_serializer.data
            },
            status=status.HTTP_200_OK
        )


class DashboardStatsView(APIView):
    """
    GET /api/issues/dashboard-stats/
    Returns summary statistics for the Dashboard:
    - total_books
    - available_books
    - total_members
    - currently_issued_books
    """
    def get(self, request):
        # Total books (sum of total quantity)
        books_qs = Book.objects.all()
        total_unique_titles = books_qs.count()
        total_copies = books_qs.aggregate(total=Sum('quantity'))['total'] or 0
        available_copies = books_qs.aggregate(total=Sum('available_quantity'))['total'] or 0

        total_members = Member.objects.count()
        currently_issued = Issue.objects.filter(status=Issue.STATUS_ISSUED).count()
        returned_count = Issue.objects.filter(status=Issue.STATUS_RETURNED).count()

        # Overdue issues count (issued and due_date < today)
        today = timezone.now().date()
        overdue_count = Issue.objects.filter(status=Issue.STATUS_ISSUED, due_date__lt=today).count()

        return Response(
            {
                "total_unique_titles": total_unique_titles,
                "total_books": total_copies,
                "available_books": available_copies,
                "total_members": total_members,
                "currently_issued_books": currently_issued,
                "returned_books_count": returned_count,
                "overdue_books_count": overdue_count,
            },
            status=status.HTTP_200_OK
        )
