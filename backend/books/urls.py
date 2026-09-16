from django.urls import path
from .views import BookListCreateView, BookDetailView, BookCategoriesView

urlpatterns = [
    path('', BookListCreateView.as_view(), name='book-list-create'),
    path('categories/', BookCategoriesView.as_view(), name='book-categories'),
    path('<int:pk>/', BookDetailView.as_view(), name='book-detail'),
]
