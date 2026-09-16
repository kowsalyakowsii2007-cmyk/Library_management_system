from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Member
from books.models import Book
from issues.models import Issue
from django.utils import timezone
from datetime import timedelta

class MemberAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.member = Member.objects.create(
            name="Alice Smith",
            email="alice.smith@college.edu",
            phone="9876543210",
            department="Computer Science"
        )

    def test_get_all_members(self):
        response = self.client.get('/api/members/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_single_member(self):
        response = self.client.get(f'/api/members/{self.member.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Alice Smith")

    def test_post_valid_member(self):
        data = {
            "name": "Bob Jones",
            "email": "bob.jones@college.edu",
            "phone": "9876543219",
            "department": "Mechanical Engineering"
        }
        response = self.client.post('/api/members/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['name'], "Bob Jones")

    def test_post_duplicate_email_rejected(self):
        data = {
            "name": "Another Alice",
            "email": "alice.smith@college.edu",
            "phone": "9876543220",
            "department": "CS"
        }
        response = self.client.post('/api/members/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_member_with_active_issue_blocked(self):
        book = Book.objects.create(
            title="Database Concepts",
            author="Silberschatz",
            category="IT",
            isbn="978-0078022159",
            quantity=2,
            available_quantity=1
        )
        Issue.objects.create(
            book=book,
            member=self.member,
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=7),
            status=Issue.STATUS_ISSUED
        )
        # Deletion must be blocked
        response = self.client.delete(f'/api/members/{self.member.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("active issued book record", response.data['error'])
