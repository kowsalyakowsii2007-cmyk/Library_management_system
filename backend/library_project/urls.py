"""
URL configuration for library_project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def api_root(request):
    return Response({
        "status": "online",
        "project": "Library Management System",
        "endpoints": {
            "books": "/api/books/",
            "members": "/api/members/",
            "issues": "/api/issues/",
            "dashboard_stats": "/api/issues/dashboard-stats/",
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/books/', include('books.urls')),
    path('api/members/', include('members.urls')),
    path('api/issues/', include('issues.urls')),
]
