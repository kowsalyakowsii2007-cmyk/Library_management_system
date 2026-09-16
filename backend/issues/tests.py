from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from books.models import Book
from members.models import Member
from issues.models import Issue
from django.utils import timezone
from datetime import timedelta

class IssueAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.book = Book.objects.create(
            title="Operating Systems",
            author="Silberschatz",
            category="CS",
            isbn="978-1118063330",
            quantity=1,
            available_quantity=1
        )
        self.member = Member.objects.create(
            name="Charlie Brown",
            email="charlie@college.edu",
            phone="9876543201",
            department="IT"
        )

    def test_issue_book_success(self):
        today = timezone.now().date()
        due = today + timedelta(days=14)
        data = {
            "book": self.book.id,
            "member": self.member.id,
            "issue_date": str(today),
            "due_date": str(due)
        }
        response = self.client.post('/api/issues/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check book available_quantity decreased
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_quantity, 0)

    def test_issue_book_when_zero_quantity_fails(self):
        today = timezone.now().date()
        due = today + timedelta(days=14)
        # First issue (1 available)
        self.client.post('/api/issues/', {
            "book": self.book.id,
            "member": self.member.id,
            "issue_date": str(today),
            "due_date": str(due)
        }, format='json')

        # Second issue attempt should fail because available_quantity is 0
        response = self.client.post('/api/issues/', {
            "book": self.book.id,
            "member": self.member.id,
            "issue_date": str(today),
            "due_date": str(due)
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_return_book_success(self):
        today = timezone.now().date()
        due = today + timedelta(days=14)
        create_res = self.client.post('/api/issues/', {
            "book": self.book.id,
            "member": self.member.id,
            "issue_date": str(today),
            "due_date": str(due)
        }, format='json')
        issue_id = create_res.data['data']['id']

        # Call return endpoint
        response = self.client.patch(f'/api/issues/{issue_id}/return/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['status'], 'Returned')

        # Check book available_quantity increased
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_quantity, 1)

    def test_cannot_return_already_returned_issue(self):
        today = timezone.now().date()
        due = today + timedelta(days=14)
        create_res = self.client.post('/api/issues/', {
            "book": self.book.id,
            "member": self.member.id,
            "issue_date": str(today),
            "due_date": str(due)
        }, format='json')
        issue_id = create_res.data['data']['id']

        # Return first time
        self.client.patch(f'/api/issues/{issue_id}/return/')

        # Return second time must fail
        response = self.client.patch(f'/api/issues/{issue_id}/return/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
