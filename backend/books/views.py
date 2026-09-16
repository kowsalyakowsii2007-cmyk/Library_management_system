from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Book
from .serializers import BookSerializer

class BookListCreateView(APIView):
    """
    GET /api/books/ - List all books with optional search & filtering.
    POST /api/books/ - Add a new book with validation.
    """
    def get(self, request):
        queryset = Book.objects.all()

        # Search by title or author or isbn
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(author__icontains=search_query) |
                Q(isbn__icontains=search_query)
            )

        # Title specific filter
        title = request.query_params.get('title', '').strip()
        if title:
            queryset = queryset.filter(title__icontains=title)

        # Author specific filter
        author = request.query_params.get('author', '').strip()
        if author:
            queryset = queryset.filter(author__icontains=author)

        # Category filter
        category = request.query_params.get('category', '').strip()
        if category and category.lower() != 'all':
            queryset = queryset.filter(category__iexact=category)

        # Availability filter
        availability = request.query_params.get('availability', '').strip().lower()
        available_param = request.query_params.get('available', '').strip().lower()

        if availability == 'available' or available_param == 'true':
            queryset = queryset.filter(available_quantity__gt=0)
        elif availability == 'unavailable' or available_param == 'false':
            queryset = queryset.filter(available_quantity=0)

        serializer = BookSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BookSerializer(data=request.data)
        if serializer.is_valid():
            book = serializer.save()
            return Response(
                {
                    "message": "Book added successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                "message": "Validation failed while adding book.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class BookDetailView(APIView):
    """
    GET /api/books/{id}/ - Retrieve a single book.
    PUT /api/books/{id}/ - Full update of a book.
    PATCH /api/books/{id}/ - Partial update of a book.
    DELETE /api/books/{id}/ - Delete a book (Blocked if active issues exist).
    """
    def get_object(self, pk):
        try:
            return Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return None

    def get(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response(
                {"error": f"Book with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = BookSerializer(book)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response(
                {"error": f"Book with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = BookSerializer(book, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Book updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "message": "Validation failed while updating book.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response(
                {"error": f"Book with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = BookSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Book updated successfully.",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        return Response(
            {
                "message": "Validation failed while updating book.",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response(
                {"error": f"Book with id {pk} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # DELETE BUSINESS RULE:
        # Check whether this book has any active Issue record (status = 'Issued')
        active_issues_count = book.issues.filter(status='Issued').count()
        if active_issues_count > 0:
            return Response(
                {
                    "error": "Cannot delete this book — it currently has an active issued record.",
                    "active_issues_count": active_issues_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        book_title = book.title
        book.delete()
        return Response(
            {"message": f"Book '{book_title}' deleted successfully."},
            status=status.HTTP_200_OK
        )


class BookCategoriesView(APIView):
    """
    GET /api/books/categories/ - Returns list of unique book categories.
    """
    def get(self, request):
        categories = Book.objects.values_list('category', flat=True).distinct()
        cleaned = sorted(list(set(c.strip() for c in categories if c and c.strip())))
        return Response(cleaned, status=status.HTTP_200_OK)
