from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'category', 'isbn', 'quantity', 'available_quantity']
        extra_kwargs = {
            'available_quantity': {'required': False}
        }

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Book title cannot be empty.")
        return value.strip()

    def validate_author(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Book author cannot be empty.")
        return value.strip()

    def validate_category(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Book category cannot be empty.")
        return value.strip()

    def validate_isbn(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("ISBN cannot be empty.")
        cleaned = value.strip()
        # Check uniqueness during update vs create
        instance = getattr(self, 'instance', None)
        qs = Book.objects.filter(isbn__iexact=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A book with this ISBN already exists.")
        return cleaned

    def validate_quantity(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Quantity must be a non-negative integer.")
        return value

    def validate(self, attrs):
        quantity = attrs.get('quantity')
        available_quantity = attrs.get('available_quantity')

        instance = getattr(self, 'instance', None)
        if instance:
            if quantity is None:
                quantity = instance.quantity
            if available_quantity is None:
                available_quantity = instance.available_quantity
        else:
            if quantity is None:
                quantity = 1
            if available_quantity is None:
                available_quantity = quantity

        if available_quantity < 0:
            raise serializers.ValidationError({
                "available_quantity": "Available quantity cannot be negative."
            })

        if available_quantity > quantity:
            raise serializers.ValidationError({
                "available_quantity": "Available quantity cannot exceed total quantity."
            })

        attrs['quantity'] = quantity
        attrs['available_quantity'] = available_quantity
        return attrs
