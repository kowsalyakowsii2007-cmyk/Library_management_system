from rest_framework import serializers
from django.utils import timezone
from .models import Issue
from books.models import Book
from members.models import Member
from books.serializers import BookSerializer
from members.serializers import MemberSerializer

class IssueSerializer(serializers.ModelSerializer):
    # Nested representation for easy display
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True)
    member_email = serializers.CharField(source='member.email', read_only=True)
    member_department = serializers.CharField(source='member.department', read_only=True)

    class Meta:
        model = Issue
        fields = [
            'id',
            'book',
            'member',
            'book_title',
            'book_author',
            'book_isbn',
            'member_name',
            'member_email',
            'member_department',
            'issue_date',
            'due_date',
            'return_date',
            'status'
        ]
        read_only_fields = ['return_date']

    def validate(self, attrs):
        issue_date = attrs.get('issue_date')
        if not issue_date:
            issue_date = timezone.now().date()
            attrs['issue_date'] = issue_date

        due_date = attrs.get('due_date')
        if not due_date:
            instance = getattr(self, 'instance', None)
            if instance:
                due_date = instance.due_date
            else:
                raise serializers.ValidationError({"due_date": "Due date is required."})

        if due_date < issue_date:
            raise serializers.ValidationError({
                "due_date": "Due date cannot be earlier than issue date."
            })

        # Only check book availability when creating a new Issue
        if not self.instance:
            book = attrs.get('book')
            if not book:
                raise serializers.ValidationError({"book": "A valid book is required."})

            # Check available quantity
            if book.available_quantity <= 0:
                raise serializers.ValidationError({
                    "book": f"Cannot issue book '{book.title}': No available copies left in the library."
                })

            member = attrs.get('member')
            if not member:
                raise serializers.ValidationError({"member": "A valid member is required."})

        return attrs


class ReturnIssueSerializer(serializers.Serializer):
    return_date = serializers.DateField(required=False, default=timezone.now)

    def validate(self, attrs):
        return attrs
