from django.urls import path
from .views import (
    IssueListCreateView,
    IssueDetailView,
    ReturnBookView,
    DashboardStatsView
)

urlpatterns = [
    path('', IssueListCreateView.as_view(), name='issue-list-create'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='issue-dashboard-stats'),
    path('<int:pk>/', IssueDetailView.as_view(), name='issue-detail'),
    path('<int:pk>/return/', ReturnBookView.as_view(), name='issue-return'),
]
