import React, { useState, useEffect } from 'react';
import { Book, Member, ActiveTab } from '../types';
import { api, extractErrorMessage } from '../services/api';
import { 
  PlusCircle, 
  BookMarked, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Clock,
  Check
} from 'lucide-react';

interface IssueBookViewProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const IssueBookView: React.FC<IssueBookViewProps> = ({ onNotify, onNavigate }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14); // 14-day loan period
  const defaultDueStr = defaultDue.toISOString().split('T')[0];

  const [issueDate, setIssueDate] = useState<string>(todayStr);
  const [dueDate, setDueDate] = useState<string>(defaultDueStr);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastIssuedRecord, setLastIssuedRecord] = useState<any | null>(null);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [booksData, membersData] = await Promise.all([
        api.getBooks(),
        api.getMembers(),
      ]);
      setBooks(booksData);
      setMembers(membersData);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load books or members for issuing.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedBook = books.find((b) => b.id === Number(selectedBookId));
  const selectedMember = members.find((m) => m.id === Number(selectedMemberId));

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedBookId) {
      errors.book = 'Please select a book to issue.';
    } else if (selectedBook && selectedBook.available_quantity <= 0) {
      errors.book = `Book "${selectedBook.title}" has 0 available copies in the library. Cannot issue.`;
    }

    if (!selectedMemberId) {
      errors.member = 'Please select a library member.';
    }

    if (!issueDate) {
      errors.issue_date = 'Issue date is required.';
    }

    if (!dueDate) {
      errors.due_date = 'Due date is required.';
    } else if (issueDate && dueDate < issueDate) {
      errors.due_date = 'Due date cannot be earlier than the issue date.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createIssue({
        book: Number(selectedBookId),
        member: Number(selectedMemberId),
        issue_date: issueDate,
        due_date: dueDate,
      });

      onNotify(
        'success',
        res.message || `Book "${selectedBook?.title}" was successfully issued to "${selectedMember?.name}".`
      );

      setLastIssuedRecord(res.data);
      // Reset form and reload updated inventory
      setSelectedBookId('');
      setSelectedMemberId('');
      setIssueDate(todayStr);
      setDueDate(defaultDueStr);
      setFieldErrors({});
      loadData();
    } catch (err: any) {
      const msg = extractErrorMessage(err.data, err.message);
      setFormError(msg);
      onNotify('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <PlusCircle className="w-6 h-6 text-indigo-600" />
            <span>Issue Book</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Issue a book to a registered library member and automatically update inventory.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onNavigate('issues')}
            className="inline-flex items-center space-x-1 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>View All Issue Records</span>
          </button>
        </div>
      </div>

      {/* Success banner after issuing */}
      {lastIssuedRecord && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                Book Issue #{lastIssuedRecord.id} Created Successfully!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                "{lastIssuedRecord.book_title}" was issued to {lastIssuedRecord.member_name} (Due:{' '}
                {lastIssuedRecord.due_date}). Available copies were automatically reduced by 1.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('issues')}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              View in Records →
            </button>
            <button
              type="button"
              onClick={() => setLastIssuedRecord(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Issue Form Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookMarked className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-sm text-slate-900">Issue Book Details</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loadingData}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Reload Catalog & Members</span>
          </button>
        </div>

        {formError && (
          <div className="m-6 mb-0 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{formError}</span>
          </div>
        )}

        <form onSubmit={handleIssueSubmit} className="p-6 space-y-6">
          {/* Step 1: Select Book */}
          <div>
            <label htmlFor="issue-book-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              1. Select Book to Issue <span className="text-rose-500">*</span>
            </label>
            <select
              id="issue-book-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.book
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            >
              <option value="">-- Choose a book from catalog --</option>
              {books.map((book) => {
                const isOutOfStock = book.available_quantity <= 0;
                return (
                  <option 
                    key={book.id} 
                    value={book.id}
                    disabled={isOutOfStock}
                  >
                    {book.title} (by {book.author}) — [{book.available_quantity}/{book.quantity} Available]
                    {isOutOfStock ? ' — [OUT OF STOCK]' : ''}
                  </option>
                );
              })}
            </select>
            {fieldErrors.book && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.book}</p>}

            {/* Selected Book Summary Badge */}
            {selectedBook && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{selectedBook.title}</span>
                  <span className="text-slate-500 ml-2">by {selectedBook.author}</span>
                  <span className="text-slate-400 font-mono ml-2">[{selectedBook.isbn}]</span>
                </div>
                <div className="flex items-center space-x-1 font-semibold">
                  <span>Available:</span>
                  <span className={selectedBook.available_quantity > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {selectedBook.available_quantity} of {selectedBook.quantity}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Select Member */}
          <div>
            <label htmlFor="issue-member-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Select Library Member <span className="text-rose-500">*</span>
            </label>
            <select
              id="issue-member-select"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.member
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            >
              <option value="">-- Choose registered member --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.department}) — {member.email}
                </option>
              ))}
            </select>
            {fieldErrors.member && <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.member}</p>}

            {/* Selected Member Summary Badge */}
            {selectedMember && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{selectedMember.name}</span>
                  <span className="text-slate-500 ml-2">({selectedMember.department})</span>
                </div>
                <div className="text-slate-600 font-mono">
                  {selectedMember.email} • {selectedMember.phone}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Issue Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="issue-date-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="issue-date-input"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    fieldErrors.issue_date
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.issue_date && (
                <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.issue_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="due-date-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="due-date-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    fieldErrors.due_date
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.due_date && (
                <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.due_date}</p>
              )}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <span>Automatic Inventory Policy:</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              When this issue is recorded, the book's <strong>available quantity</strong> will be automatically decremented by 1 in the database. When the member later returns the book, the count will automatically increment back by 1.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="submit"
              disabled={isSubmitting || loadingData}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Recording Issue in Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Issue Book Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
