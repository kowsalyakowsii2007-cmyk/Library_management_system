import React, { useState, useEffect, useCallback } from 'react';
import { Issue, ActiveTab } from '../types';
import { api, extractErrorMessage } from '../services/api';
import { ConfirmModal } from './ConfirmModal';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  RefreshCw, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Calendar, 
  BookOpen, 
  User, 
  Trash2,
  PlusCircle
} from 'lucide-react';

interface IssueRecordsViewProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const IssueRecordsView: React.FC<IssueRecordsViewProps> = ({ onNotify, onNavigate }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Return Book Modal State
  const [returningIssue, setReturningIssue] = useState<Issue | null>(null);
  const [customReturnDate, setCustomReturnDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Delete Issue Record State
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getIssues({
        status: selectedStatus,
        search: searchQuery,
      });
      setIssues(data);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to fetch issue records from backend.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery, onNotify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchIssues]);

  const handleReturnConfirm = async () => {
    if (!returningIssue) return;
    setIsProcessingReturn(true);
    try {
      const res = await api.returnBook(returningIssue.id, customReturnDate);
      onNotify(
        'success',
        res.message || `Book "${returningIssue.book_title}" was returned. Inventory restored by 1.`
      );
      setReturningIssue(null);
      fetchIssues();
    } catch (err: any) {
      const msg = extractErrorMessage(err.data, err.message);
      onNotify('error', msg);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIssue) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteIssue(deletingIssue.id);
      onNotify('success', res.message || `Issue record #${deletingIssue.id} was deleted.`);
      setDeletingIssue(null);
      fetchIssues();
    } catch (err: any) {
      const msg = extractErrorMessage(err.data, err.message);
      onNotify('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            <span>Issue & Return Records</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track circulation history, process returns, and monitor overdue borrow records.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchIssues()}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('issue-book')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Records
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('Issued')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedStatus === 'Issued'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Currently Issued
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('Returned')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedStatus === 'Returned'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Returned
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Book Title, ISBN, Member Name, or Email..."
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
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && issues.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-sm">Fetching circulation history from backend...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No issue records found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== 'all'
                ? 'No records match your filters. Try clearing your search parameters.'
                : 'No book issue records have been logged yet.'}
            </p>
            {searchQuery || selectedStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => onNavigate('issue-book')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Issue a Book Now
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-14 text-slate-400">ID</th>
                  <th className="px-4 py-3.5">Book Details</th>
                  <th className="px-4 py-3.5">Member Details</th>
                  <th className="px-4 py-3.5">Issue Date</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5">Return Date</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue) => {
                  const isReturned = issue.status === 'Returned';
                  const isOverdue = !isReturned && issue.due_date < todayStr;

                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">
                        #{issue.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {issue.book_title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ISBN: <span className="font-mono">{issue.book_isbn}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {issue.member_name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {issue.member_department} • <span className="font-mono">{issue.member_email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{issue.issue_date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <div className={`flex items-center space-x-1.5 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{issue.due_date}</span>
                          {isOverdue && <span className="text-xs font-semibold">(Overdue)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap text-xs">
                        {issue.return_date ? (
                          <span className="text-emerald-700 font-medium">
                            {issue.return_date}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">— Pending —</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isReturned ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Returned</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertOctagon className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Issued</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {!isReturned && (
                            <button
                              type="button"
                              onClick={() => {
                                setReturningIssue(issue);
                                setCustomReturnDate(todayStr);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                              title="Process book return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return Book</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingIssue(issue)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete issue record"
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

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {issues.length} circulation record{issues.length === 1 ? '' : 's'}</span>
          <span>Library Circulation Desk</span>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {returningIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Book Return</h3>
                <p className="text-xs text-slate-500">Record actual return date & restore book inventory.</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Book:</span>
                <span className="font-semibold text-slate-800 text-right">{returningIssue.book_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-slate-800">{returningIssue.member_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued On:</span>
                <span className="font-mono text-slate-700">{returningIssue.issue_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-mono text-slate-700">{returningIssue.due_date}</span>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="return-date-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Actual Return Date
              </label>
              <input
                id="return-date-input"
                type="date"
                value={customReturnDate}
                onChange={(e) => setCustomReturnDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              />
              <p className="mt-1.5 text-xs text-emerald-700">
                ✓ When returned, available quantity of "{returningIssue.book_title}" will increase by 1.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isProcessingReturn}
                onClick={() => setReturningIssue(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingReturn}
                onClick={handleReturnConfirm}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-2"
              >
                {isProcessingReturn && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Complete Return</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingIssue)}
        title="Delete Issue Record"
        message={
          deletingIssue
            ? `Are you sure you want to delete Issue record #${deletingIssue.id} (${deletingIssue.book_title} to ${deletingIssue.member_name})?`
            : ''
        }
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingIssue(null)}
      />
    </div>
  );
};
