from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from books.models import Book
from members.models import Member

class Issue(models.Model):
    STATUS_ISSUED = 'Issued'
    STATUS_RETURNED = 'Returned'
    STATUS_CHOICES = [
        (STATUS_ISSUED, 'Issued'),
        (STATUS_RETURNED, 'Returned'),
    ]

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='issues',
        help_text="The book being issued"
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='issues',
        help_text="The library member issuing the book"
    )
    issue_date = models.DateField(default=timezone.now, help_text="Date when book was issued")
    due_date = models.DateField(help_text="Date when book is due for return")
    return_date = models.DateField(null=True, blank=True, help_text="Actual date when book was returned")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ISSUED,
        help_text="Current status of the issue (Issued or Returned)"
    )

    class Meta:
        ordering = ['-id']
        verbose_name = 'Issue'
        verbose_name_plural = 'Issues'

    def clean(self):
        super().clean()
        if self.issue_date and self.due_date:
            if self.due_date < self.issue_date:
                raise ValidationError({'due_date': 'Due date cannot be earlier than issue date.'})
        if self.return_date and self.issue_date:
            if self.return_date < self.issue_date:
                raise ValidationError({'return_date': 'Return date cannot be earlier than issue date.'})

    def __str__(self):
        return f"Issue #{self.id}: {self.book.title} to {self.member.name} [{self.status}]"
