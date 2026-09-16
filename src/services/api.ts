import { Book, Member, Issue, DashboardStats } from '../types';

/**
 * Centralized API Base URL configuration.
 *
 * Defaults to the Django REST API running at http://127.0.0.1:8000.
 * Can be overridden via the VITE_API_BASE_URL environment variable.
 * When running in an HTTPS container preview, defaults to relative URL
 * so Vite's dev server proxy forwards requests seamlessly without Mixed Content blocks.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : '';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Extracts human-readable error messages from Django REST Framework responses.
 * Preserves specific backend validation messages, especially:
 * "Cannot delete this book — it currently has an active issued record."
 */
export function extractErrorMessage(data: any, fallbackMessage: string = 'An error occurred'): string {
  if (!data) return fallbackMessage;

  // 1. Check top-level 'error' field (used by custom delete and return rules)
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  // 2. Check 'detail' field standard in DRF
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail.trim();
  }

  // 3. Check 'message' field combined with 'errors'
  let msg = '';
  if (typeof data.message === 'string' && data.message.trim()) {
    msg = data.message.trim();
  }

  const errors = data.errors || (typeof data === 'object' && !Array.isArray(data) ? data : null);
  if (errors && typeof errors === 'object') {
    const errorDetails: string[] = [];
    for (const [field, val] of Object.entries(errors)) {
      if (field === 'error' || field === 'message' || field === 'status') continue;
      if (Array.isArray(val)) {
        errorDetails.push(`${field}: ${val.join(', ')}`);
      } else if (typeof val === 'string') {
        errorDetails.push(`${field}: ${val}`);
      }
    }
    if (errorDetails.length > 0) {
      return msg ? `${msg} (${errorDetails.join(' | ')})` : errorDetails.join(' | ');
    }
  }

  return msg || fallbackMessage;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMessage = extractErrorMessage(
        data,
        `Request failed with status ${response.status}: ${response.statusText}`
      );
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or connection error
    throw new ApiError(
      `Unable to connect to backend server at ${API_BASE_URL}. Please ensure the Django REST API is running.`,
      0,
      null
    );
  }
}

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/issues/dashboard-stats/');
  },

  // Books
  async getBooks(params?: { search?: string; category?: string; availability?: string }): Promise<Book[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.availability && params.availability !== 'all') query.append('availability', params.availability);

    const qs = query.toString();
    return request<Book[]>(`/api/books/${qs ? `?${qs}` : ''}`);
  },

  async getBookCategories(): Promise<string[]> {
    return request<string[]>('/api/books/categories/');
  },

  async getBook(id: number): Promise<Book> {
    return request<Book>(`/api/books/${id}/`);
  },

  async createBook(book: Omit<Book, 'id'>): Promise<{ message: string; data: Book }> {
    return request<{ message: string; data: Book }>('/api/books/', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  },

  async updateBook(id: number, book: Partial<Book>): Promise<{ message: string; data: Book }> {
    return request<{ message: string; data: Book }>(`/api/books/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
  },

  async deleteBook(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/books/${id}/`, {
      method: 'DELETE',
    });
  },

  // Members
  async getMembers(params?: { search?: string; department?: string }): Promise<Member[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.department && params.department !== 'all') query.append('department', params.department);

    const qs = query.toString();
    return request<Member[]>(`/api/members/${qs ? `?${qs}` : ''}`);
  },

  async getMember(id: number): Promise<Member> {
    return request<Member>(`/api/members/${id}/`);
  },

  async createMember(member: Omit<Member, 'id'>): Promise<{ message: string; data: Member }> {
    return request<{ message: string; data: Member }>('/api/members/', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  },

  async updateMember(id: number, member: Partial<Member>): Promise<{ message: string; data: Member }> {
    return request<{ message: string; data: Member }>(`/api/members/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
  },

  async deleteMember(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/members/${id}/`, {
      method: 'DELETE',
    });
  },

  // Issues
  async getIssues(params?: { status?: string; search?: string }): Promise<Issue[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return request<Issue[]>(`/api/issues/${qs ? `?${qs}` : ''}`);
  },

  async createIssue(payload: {
    book: number;
    member: number;
    issue_date?: string;
    due_date: string;
  }): Promise<{ message: string; data: Issue }> {
    return request<{ message: string; data: Issue }>('/api/issues/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async returnBook(issueId: number, returnDate?: string): Promise<{ message: string; data: Issue }> {
    return request<{ message: string; data: Issue }>(`/api/issues/${issueId}/return/`, {
      method: 'PATCH',
      body: JSON.stringify(returnDate ? { return_date: returnDate } : {}),
    });
  },

  async deleteIssue(issueId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/issues/${issueId}/`, {
      method: 'DELETE',
    });
  },
};
