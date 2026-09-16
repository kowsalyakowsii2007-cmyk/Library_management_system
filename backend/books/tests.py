from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Book
from members.models import Member
from issues.models import Issue
from django.utils import timezone
from datetime import timedelta

class BookAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_book_data = {
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "category": "Computer Science",
            "isbn": "978-0132350884",
            "quantity": 3,
            "available_quantity": 3
        }
        self.book = Book.objects.create(**self.valid_book_data)

    def test_get_all_books(self):
        response = self.client.get('/api/books/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_single_book(self):
        response = self.client.get(f'/api/books/{self.book.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Clean Code")

    def test_post_valid_book(self):
        data = {
            "title": "Design Patterns",
            "author": "Erich Gamma et al.",
            "category": "Software Engineering",
            "isbn": "978-0201633610",
            "quantity": 2,
            "available_quantity": 2
        }
        response = self.client.post('/api/books/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['title'], "Design Patterns")

    def test_post_invalid_book_empty_title(self):
        data = {
            "title": "",
            "author": "Test Author",
            "category": "Test",
            "isbn": "111-222-333",
            "quantity": 1
        }
        response = self.client.post('/api/books/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_book_without_issues_succeeds(self):
        response = self.client.delete(f'/api/books/{self.book.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Book.objects.filter(id=self.book.id).exists())

    def test_delete_book_with_active_issue_blocked(self):
        member = Member.objects.create(
            name="Test Student",
            email="student@college.edu",
            phone="9876543210",
            department="CS"
        )
        Issue.objects.create(
            book=self.book,
            member=member,
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=7),
            status=Issue.STATUS_ISSUED
        )
        # Attempt to delete book with active issue
        response = self.client.delete(f'/api/books/{self.book.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("active issued record", response.data['error'])
