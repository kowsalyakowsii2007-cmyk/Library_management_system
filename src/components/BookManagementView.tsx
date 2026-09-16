import React, { useState, useEffect, useCallback } from 'react';
import { Book, ActiveTab } from '../types';
import { api, extractErrorMessage } from '../services/api';
import { BookFormModal } from './BookFormModal';
import { ConfirmModal } from './ConfirmModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  BookMarked, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Share2
} from 'lucide-react';

interface BookManagementViewProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const BookManagementView: React.FC<BookManagementViewProps> = ({ onNotify, onNavigate }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Delete state
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBooks({
        search: searchQuery,
        category: selectedCategory,
        availability: selectedAvailability,
      });
      setBooks(data);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to fetch books from backend.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedAvailability, onNotify]);

  const fetchCategories = async () => {
    try {
      const cats = await api.getBookCategories();
      setCategories(cats);
    } catch {
      // Fallback default categories
      setCategories(['Computer Science', 'Physics', 'Mathematics', 'Electrical', 'Literature']);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  const handleOpenAdd = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteBook(bookToDelete.id);
      onNotify('success', res.message || `Book "${bookToDelete.title}" was deleted.`);
      setBookToDelete(null);
      fetchBooks();
      fetchCategories();
    } catch (err: any) {
      // CRITICAL: Display the exact backend error message:
      // "Cannot delete this book — it currently has an active issued record."
      const specificError = extractErrorMessage(
        err.data,
        `Cannot delete book "${bookToDelete.title}". It may have active issued records.`
      );
      onNotify('error', specificError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookMarked className="w-6 h-6 text-indigo-600" />
            <span>Book Management</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, add, edit, and manage library books and inventories.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchBooks()}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Book List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Title, Author, or ISBN..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          >
            <option value="all">All Stock Status</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Books Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && books.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-sm">Fetching books catalog from backend...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No books found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all'
                ? 'No books match your search filters. Try clearing your search parameters.'
                : 'Your library catalog is empty. Click "Add Book" above to add your first book.'}
            </p>
            {searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedAvailability('all');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                Reset Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-14 text-slate-400">ID</th>
                  <th className="px-4 py-3.5">Title & Author</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 font-mono">ISBN</th>
                  <th className="px-4 py-3.5 text-center">Total</th>
                  <th className="px-4 py-3.5 text-center">Available</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => {
                  const isAvailable = book.available_quantity > 0;

                  return (
                    <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">
                        #{book.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {book.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {book.author}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                        {book.isbn}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                        {book.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`font-bold text-sm ${
                            book.available_quantity === 0
                              ? 'text-rose-600'
                              : book.available_quantity === 1
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {book.available_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Unavailable</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {isAvailable && (
                            <button
                              type="button"
                              onClick={() => onNavigate('issue-book')}
                              title="Issue this book to a member"
                              className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(book)}
                            title="Edit book details"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookToDelete(book)}
                            title="Delete book"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Count */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {books.length} book{books.length === 1 ? '' : 's'}</span>
          <span>College Library Catalog</span>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      <BookFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          onNotify('success', msg);
          fetchBooks();
          fetchCategories();
        }}
        bookToEdit={editingBook}
        existingCategories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Delete Book Record"
        message={
          bookToDelete
            ? `Are you sure you want to permanently delete "${bookToDelete.title}" (ISBN: ${bookToDelete.isbn}) from the library catalog? If there are active issued records, the backend will block deletion.`
            : ''
        }
        confirmLabel="Delete Book"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  );
};
