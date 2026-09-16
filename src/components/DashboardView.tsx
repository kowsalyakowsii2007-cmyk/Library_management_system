import React, { useEffect, useState } from 'react';
import { DashboardStats, Issue, Book, ActiveTab } from '../types';
import { api } from '../services/api';
import { 
  BookMarked, 
  CheckCircle, 
  Users, 
  Clock, 
  AlertOctagon, 
  History, 
  PlusCircle, 
  RefreshCw, 
  ArrowRight,
  BookOpen,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onSelectIssue?: (issue: Issue) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, issuesData, booksData] = await Promise.all([
        api.getDashboardStats(),
        api.getIssues(),
        api.getBooks({ availability: 'all' }),
      ]);

      setStats(statsData);
      setRecentIssues(issuesData.slice(0, 5)); // Take latest 5 issues
      setLowStockBooks(booksData.filter((b) => b.available_quantity === 0 || b.available_quantity <= 1).slice(0, 4));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading library statistics from Django API...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Library Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time catalog, circulation, and membership statistics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('issue-book')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Book</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-semibold text-rose-900 underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Books */}
        <div 
          onClick={() => onNavigate('books')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Books</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BookMarked className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats ? stats.total_books : 0}
            </span>
            <span className="text-xs text-slate-500 ml-2">copies</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats?.total_unique_titles || 0} unique titles</span>
            <span className="text-indigo-600 font-medium group-hover:underline inline-flex items-center">
              Manage <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Available Books */}
        <div 
          onClick={() => onNavigate('books')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Books</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats ? stats.available_books : 0}
            </span>
            <span className="text-xs text-slate-500 ml-2">in stock</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Ready to issue</span>
            <span className="text-emerald-600 font-medium group-hover:underline inline-flex items-center">
              View <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Total Members */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Members</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats ? stats.total_members : 0}
            </span>
            <span className="text-xs text-slate-500 ml-2">registered</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Students & faculty</span>
            <span className="text-blue-600 font-medium group-hover:underline inline-flex items-center">
              Manage <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Currently Issued Books */}
        <div 
          onClick={() => onNavigate('issues')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Currently Issued</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats ? stats.currently_issued_books : 0}
            </span>
            <span className="text-xs text-slate-500 ml-2">active</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span className={stats && stats.overdue_books_count > 0 ? 'text-rose-600 font-medium' : ''}>
              {stats?.overdue_books_count || 0} overdue
            </span>
            <span className="text-amber-600 font-medium group-hover:underline inline-flex items-center">
              Records <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Returned Books</p>
              <p className="text-xl font-bold text-slate-900">{stats?.returned_books_count ?? 0}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('issues')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            View History →
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Overdue Pending Returns</p>
              <p className="text-xl font-bold text-slate-900">{stats?.overdue_books_count ?? 0}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('issues')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900"
          >
            Filter Overdue →
          </button>
        </div>
      </div>

      {/* 2-Column Split: Recent Issues & Low Stock Books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Issues Table (2/3 width on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-base">Recent Issues</h3>
            </div>
            <button
              onClick={() => onNavigate('issues')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Records →
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No book issue records recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Book Title</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentIssues.map((issue) => {
                    const isOverdue =
                      issue.status === 'Issued' &&
                      new Date(issue.due_date) < new Date(new Date().toISOString().split('T')[0]);

                    return (
                      <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="truncate max-w-[220px]" title={issue.book_title}>
                            {issue.book_title}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{issue.book_isbn}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div>{issue.member_name}</div>
                          <span className="text-xs text-slate-500">{issue.member_department}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{issue.due_date}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              issue.status === 'Returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.status === 'Returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Books / Catalog Watch (1/3 width on desktop) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-base">Catalog Alerts</h3>
            </div>
            <button
              onClick={() => onNavigate('books')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              All Books →
            </button>
          </div>

          <div className="p-4 flex-1">
            {lowStockBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-6">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-slate-700">Healthy Stock</p>
                <p className="text-xs text-slate-500 mt-0.5">All titles have copies available for checkout.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">Titles with limited or zero copies available:</p>
                {lowStockBooks.map((book) => (
                  <div 
                    key={book.id} 
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <p className="text-sm font-semibold text-slate-900 truncate" title={book.title}>
                        {book.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{book.author} • {book.category}</p>
                    </div>
                    <span 
                      className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-md ${
                        book.available_quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {book.available_quantity === 0 ? '0 Left' : '1 Left'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100">
            <button
              onClick={() => onNavigate('books')}
              className="w-full py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Manage Book Quantities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
