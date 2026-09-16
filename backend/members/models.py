import re
from django.db import models
from django.core.exceptions import ValidationError

def validate_phone_number(value):
    # Standard phone regex allowing numbers, spaces, hyphens, parentheses, and optional leading +
    cleaned = re.sub(r'[\s\-\(\)]', '', value)
    if not re.match(r'^\+?[0-9]{7,15}$', cleaned):
        raise ValidationError('Please enter a valid phone number (7 to 15 digits).')

class Member(models.Model):
    name = models.CharField(max_length=150, help_text="Full name of the member")
    email = models.EmailField(unique=True, help_text="Unique valid email address")
    phone = models.CharField(max_length=20, validators=[validate_phone_number], help_text="Phone contact number")
    department = models.CharField(max_length=100, help_text="Academic department or designation")

    class Meta:
        ordering = ['-id']
        verbose_name = 'Member'
        verbose_name_plural = 'Members'

    def clean(self):
        super().clean()
        if not self.name or not self.name.strip():
            raise ValidationError({'name': 'Member name cannot be empty.'})
        if not self.email or not self.email.strip():
            raise ValidationError({'email': 'Member email cannot be empty.'})
        if not self.department or not self.department.strip():
            raise ValidationError({'department': 'Department cannot be empty.'})
        if self.phone:
            validate_phone_number(self.phone)

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        if self.email:
            self.email = self.email.strip().lower()
        if self.phone:
            self.phone = self.phone.strip()
        if self.department:
            self.department = self.department.strip()
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.department})"
