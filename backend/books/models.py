from django.db import models
from django.core.exceptions import ValidationError

class Book(models.Model):
    title = models.CharField(max_length=200, help_text="Title of the book")
    author = models.CharField(max_length=200, help_text="Author of the book")
    category = models.CharField(max_length=100, help_text="Category/genre of the book")
    isbn = models.CharField(max_length=30, unique=True, help_text="Unique ISBN number")
    quantity = models.IntegerField(default=1, help_text="Total number of copies in the library")
    available_quantity = models.IntegerField(default=1, help_text="Number of copies currently available for issue")

    class Meta:
        ordering = ['-id']
        verbose_name = 'Book'
        verbose_name_plural = 'Books'

    def clean(self):
        super().clean()
        if not self.title or not self.title.strip():
            raise ValidationError({'title': 'Book title cannot be empty.'})
        if not self.author or not self.author.strip():
            raise ValidationError({'author': 'Book author cannot be empty.'})
        if not self.category or not self.category.strip():
            raise ValidationError({'category': 'Book category cannot be empty.'})
        if not self.isbn or not self.isbn.strip():
            raise ValidationError({'isbn': 'ISBN cannot be empty.'})
        if self.quantity < 0:
            raise ValidationError({'quantity': 'Quantity cannot be negative.'})
        if self.available_quantity < 0:
            raise ValidationError({'available_quantity': 'Available quantity cannot be negative.'})
        if self.available_quantity > self.quantity:
            raise ValidationError({'available_quantity': 'Available quantity cannot exceed total quantity.'})

    def save(self, *args, **kwargs):
        # Auto-set available_quantity if not provided upon creation
        if self.available_quantity is None:
            self.available_quantity = self.quantity
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.isbn})"
