from django.contrib import admin
from .models import Issue

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('id', 'book', 'member', 'issue_date', 'due_date', 'return_date', 'status')
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('book__title', 'member__name', 'member__email')
