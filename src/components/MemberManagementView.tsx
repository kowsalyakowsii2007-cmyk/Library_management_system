import React, { useState, useEffect, useCallback } from 'react';
import { Member, ActiveTab } from '../types';
import { api, extractErrorMessage } from '../services/api';
import { MemberFormModal } from './MemberFormModal';
import { ConfirmModal } from './ConfirmModal';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  RefreshCw, 
  Mail, 
  Phone, 
  Building2,
  Share2
} from 'lucide-react';

interface MemberManagementViewProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const MemberManagementView: React.FC<MemberManagementViewProps> = ({ onNotify, onNavigate }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Delete state
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMembers({
        search: searchQuery,
        department: selectedDepartment,
      });
      setMembers(data);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to fetch members from backend.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDepartment, onNotify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  // Extract unique departments for filter dropdown
  const departments = Array.from(new Set(members.map((m) => m.department))).filter(Boolean);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteMember(memberToDelete.id);
      onNotify('success', res.message || `Member "${memberToDelete.name}" was deleted.`);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err: any) {
      // CRITICAL: Display the exact backend error message:
      // "Cannot delete this member — they currently have an active issued book record."
      const specificError = extractErrorMessage(
        err.data,
        `Cannot delete member "${memberToDelete.name}". They may currently have active issued books.`
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
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Member Management</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage student and faculty library cardholder records.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchMembers()}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Member List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
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
            placeholder="Search by Member Name, Email, or Department..."
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

        {/* Department Filter */}
        {departments.length > 0 && (
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Members Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && members.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-sm">Fetching members directory from backend...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No members found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedDepartment !== 'all'
                ? 'No members match your search criteria. Try clearing search filters.'
                : 'No members are registered yet. Click "Add Member" above to create the first membership card.'}
            </p>
            {searchQuery || selectedDepartment !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDepartment('all');
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
                  <th className="px-4 py-3.5">Member Name</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">
                      #{member.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Member ID: <span className="font-mono">MEM-{String(member.id).padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                        {member.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => onNavigate('issue-book')}
                          title="Issue a book to this member"
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(member)}
                          title="Edit member details"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          title="Delete member"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Count */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {members.length} registered member{members.length === 1 ? '' : 's'}</span>
          <span>College Member Directory</span>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      <MemberFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          onNotify('success', msg);
          fetchMembers();
        }}
        memberToEdit={editingMember}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(memberToDelete)}
        title="Delete Member Record"
        message={
          memberToDelete
            ? `Are you sure you want to delete member "${memberToDelete.name}" (${memberToDelete.email})? If they currently have any active issued book records, the backend will block deletion.`
            : ''
        }
        confirmLabel="Delete Member"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
};
