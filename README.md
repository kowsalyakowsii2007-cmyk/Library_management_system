# Library Management System

A full-stack student-level CRUD web application developed with **Django REST Framework (Python)**, **SQLite**, and **React (Vite + TypeScript)**.

---

## 1. Project Overview

The **Library Management System** manages library operations for a college campus. It provides:
- **Book Catalog Management**: Full CRUD operations for books with inventory tracking (`total_quantity`, `available_quantity`), category categorization, and ISBN tracking.
- **Member Management**: Registration and directory for students and faculty members.
- **Book Circulation (Issue & Return)**:
  - Issuing books with due dates and member association.
  - Automatic deduction of `available_quantity` upon issue.
  - Processing book returns with return date recording and automatic inventory restoration.
- **Data Integrity & Business Rules**:
  - **Delete Protection**: Books or members with active issued book records **cannot be deleted**; the backend blocks the operation with an explicit error message (`"Cannot delete this book — it currently has an active issued record."`).
  - **Availability Validation**: Books with 0 available copies cannot be issued.
- **Real-Time Dashboard**: Summarizes total books, available copies, registered members, active issues, and overdue returns.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React icons
- **Backend**: Python 3, Django 5+, Django REST Framework (DRF)
- **Database**: SQLite 3 (`db.sqlite3`)
- **API Architecture**: RESTful JSON APIs

---

## 3. Project Directory Structure

```
├── backend/
│   ├── manage.py
│   ├── db.sqlite3
│   ├── requirements.txt
│   ├── library_project/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── books/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── members/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   └── issues/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── DashboardView.tsx
│   │   ├── BookManagementView.tsx
│   │   ├── BookFormModal.tsx
│   │   ├── MemberManagementView.tsx
│   │   ├── MemberFormModal.tsx
│   │   ├── IssueBookView.tsx
│   │   └── IssueRecordsView.tsx
│   ├── services/
│   │   └── api.ts             # Centralized API service layer
│   ├── types.ts               # Shared TypeScript data models
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── README.md
```

---

## 4. How to Run the Application

### Backend (Django REST API)
```bash
# Navigate to the backend directory
cd backend

# (Optional) Activate your Python virtual environment
# python3 -m venv venv
# source venv/bin/activate   # On Linux/macOS
# venv\Scripts\activate      # On Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver 8000
```
*The API will be live at `http://127.0.0.1:8000/api/`.*

### Frontend (React + Vite)
```bash
# In the project root directory
npm install

# Start the Vite development server
npm run dev
```
*Open your browser at `http://localhost:3000` to interact with the application.*

---

## 5. REST API Endpoints

### Books API (`/api/books/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/books/` | List all books (supports `?search=`, `?category=`, `?availability=`) |
| `POST` | `/api/books/` | Add a new book (validates title, ISBN, quantity) |
| `GET` | `/api/books/{id}/` | Retrieve book details |
| `PUT` | `/api/books/{id}/` | Update book details |
| `DELETE` | `/api/books/{id}/` | Delete a book (blocked if active issue exists) |
| `GET` | `/api/books/categories/` | List all distinct book categories |

### Members API (`/api/members/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/members/` | List all members (supports `?search=`, `?department=`) |
| `POST` | `/api/members/` | Register a new member (validates email uniqueness & phone) |
| `GET` | `/api/members/{id}/` | Retrieve member details |
| `PUT` | `/api/members/{id}/` | Update member details |
| `DELETE` | `/api/members/{id}/` | Delete a member (blocked if active issue exists) |

### Issues API (`/api/issues/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/issues/` | List all issue records (supports `?status=`, `?search=`) |
| `POST` | `/api/issues/` | Issue a book (validates stock > 0, decrements available count) |
| `PATCH`| `/api/issues/{id}/return/` | Process return (sets status='Returned', increments available count) |
| `GET` | `/api/issues/dashboard-stats/` | Aggregated statistics for dashboard cards |

---

## 6. Viva & Project Demonstration Highlights

1. **Relational Integrity with Business Logic**:
   - Deletion protection is enforced on the database/backend layer (`perform_destroy` in `views.py`), ensuring that deleting a member or book through the API or frontend never leaves orphaned issue records.
2. **Automatic Stock Synchronization**:
   - Database transactions or model hooks automatically decrease `available_quantity` when a book is issued and restore it upon return.
3. **Dual Validation**:
   - Client-side validation prevents invalid form submissions (e.g. empty strings, invalid emails, negative counts, due dates earlier than issue dates).
   - Server-side validation (`serializers.py` and models) guarantees consistency even when accessed directly via tools like Postman or cURL.
