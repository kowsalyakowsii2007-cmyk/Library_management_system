export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  quantity: number;
  available_quantity: number;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
}

export interface Issue {
  id: number;
  book: number;
  member: number;
  book_title: string;
  book_author: string;
  book_isbn: string;
  member_name: string;
  member_email: string;
  member_department: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: 'Issued' | 'Returned';
}

export interface DashboardStats {
  total_unique_titles: number;
  total_books: number;
  available_books: number;
  total_members: number;
  currently_issued_books: number;
  returned_books_count: number;
  overdue_books_count: number;
}

export type ActiveTab = 'dashboard' | 'books' | 'members' | 'issue-book' | 'issues';

export interface AlertNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
}
