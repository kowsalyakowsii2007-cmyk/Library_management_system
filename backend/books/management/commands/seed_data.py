from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from books.models import Book
from members.models import Member
from issues.models import Issue

class Command(BaseCommand):
    help = 'Seeds initial sample data for Library Management System demonstration'

    def handle(self, *args, **options):
        self.stdout.write("Clearing existing data...")
        Issue.objects.all().delete()
        Book.objects.all().delete()
        Member.objects.all().delete()

        self.stdout.write("Seeding books...")
        books_data = [
            {
                "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
                "author": "Robert C. Martin",
                "category": "Computer Science",
                "isbn": "978-0132350884",
                "quantity": 5,
                "available_quantity": 4
            },
            {
                "title": "Introduction to Algorithms",
                "author": "Thomas H. Cormen, Charles E. Leiserson",
                "category": "Computer Science",
                "isbn": "978-0262033848",
                "quantity": 4,
                "available_quantity": 3
            },
            {
                "title": "Database System Concepts",
                "author": "Abraham Silberschatz, Henry F. Korth",
                "category": "Information Technology",
                "isbn": "978-0078022159",
                "quantity": 3,
                "available_quantity": 3
            },
            {
                "title": "Computer Networks: A Systems Approach",
                "author": "Larry L. Peterson, Bruce S. Davie",
                "category": "Networking",
                "isbn": "978-0123850591",
                "quantity": 3,
                "available_quantity": 2
            },
            {
                "title": "Operating System Concepts",
                "author": "Abraham Silberschatz, Peter B. Galvin",
                "category": "Computer Science",
                "isbn": "978-1118063330",
                "quantity": 4,
                "available_quantity": 4
            },
            {
                "title": "Artificial Intelligence: A Modern Approach",
                "author": "Stuart Russell, Peter Norvig",
                "category": "Artificial Intelligence",
                "isbn": "978-0136042594",
                "quantity": 2,
                "available_quantity": 1
            },
            {
                "title": "Principles of Electrical Engineering",
                "author": "Vincent Del Toro",
                "category": "Electrical Engineering",
                "isbn": "978-0136951230",
                "quantity": 3,
                "available_quantity": 3
            },
            {
                "title": "Digital Logic and Computer Design",
                "author": "M. Morris Mano",
                "category": "Electronics",
                "isbn": "978-9332542525",
                "quantity": 3,
                "available_quantity": 3
            }
        ]

        created_books = []
        for b_data in books_data:
            book = Book.objects.create(**b_data)
            created_books.append(book)

        self.stdout.write("Seeding members...")
        members_data = [
            {
                "name": "Aarav Sharma",
                "email": "aarav.sharma@college.edu",
                "phone": "+91-9876543210",
                "department": "Computer Science"
            },
            {
                "name": "Priya Patel",
                "email": "priya.patel@college.edu",
                "phone": "+91-9876543211",
                "department": "Information Technology"
            },
            {
                "name": "Rahul Verma",
                "email": "rahul.verma@college.edu",
                "phone": "+91-9876543212",
                "department": "Electronics"
            },
            {
                "name": "Sneha Kulkarni",
                "email": "sneha.k@college.edu",
                "phone": "+91-9876543213",
                "department": "Electrical Engineering"
            },
            {
                "name": "Vikram Malhotra",
                "email": "vikram.m@college.edu",
                "phone": "+91-9876543214",
                "department": "Mechanical Engineering"
            }
        ]

        created_members = []
        for m_data in members_data:
            member = Member.objects.create(**m_data)
            created_members.append(member)

        self.stdout.write("Seeding issue records...")
        today = timezone.now().date()
        # Active issue 1: Clean Code to Aarav
        Issue.objects.create(
            book=created_books[0],
            member=created_members[0],
            issue_date=today - timedelta(days=5),
            due_date=today + timedelta(days=9),
            status=Issue.STATUS_ISSUED
        )

        # Active issue 2: Introduction to Algorithms to Priya
        Issue.objects.create(
            book=created_books[1],
            member=created_members[1],
            issue_date=today - timedelta(days=10),
            due_date=today + timedelta(days=4),
            status=Issue.STATUS_ISSUED
        )

        # Active issue 3: Computer Networks to Rahul
        Issue.objects.create(
            book=created_books[3],
            member=created_members[2],
            issue_date=today - timedelta(days=16),
            due_date=today - timedelta(days=2),  # Overdue demo!
            status=Issue.STATUS_ISSUED
        )

        # Active issue 4: AI Modern Approach to Sneha
        Issue.objects.create(
            book=created_books[5],
            member=created_members[3],
            issue_date=today - timedelta(days=3),
            due_date=today + timedelta(days=11),
            status=Issue.STATUS_ISSUED
        )

        # Returned record: Database System Concepts by Vikram (returned on time)
        Issue.objects.create(
            book=created_books[2],
            member=created_members[4],
            issue_date=today - timedelta(days=20),
            due_date=today - timedelta(days=6),
            return_date=today - timedelta(days=7),
            status=Issue.STATUS_RETURNED
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded initial demonstration data!"))
