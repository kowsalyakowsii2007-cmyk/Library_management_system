from django.contrib import admin
from .models import Member

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'department')
    search_fields = ('name', 'email', 'department')
