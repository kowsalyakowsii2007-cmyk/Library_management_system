import re
from rest_framework import serializers
from .models import Member

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'name', 'email', 'phone', 'department']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Member name cannot be empty.")
        return value.strip()

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email address cannot be empty.")
        cleaned = value.strip().lower()

        # Check uniqueness during update vs create
        instance = getattr(self, 'instance', None)
        qs = Member.objects.filter(email__iexact=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A member with this email already exists.")
        return cleaned

    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number cannot be empty.")
        cleaned = value.strip()
        stripped_digits = re.sub(r'[\s\-\(\)]', '', cleaned)
        if not re.match(r'^\+?[0-9]{7,15}$', stripped_digits):
            raise serializers.ValidationError("Please provide a valid phone number (7-15 digits).")
        return cleaned

    def validate_department(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Department cannot be empty.")
        return value.strip()
