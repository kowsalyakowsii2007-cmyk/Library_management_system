import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { api, extractErrorMessage } from '../services/api';
import { X, UserPlus, UserCheck, AlertCircle } from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  memberToEdit?: Member | null;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberToEdit,
}) => {
  const isEditing = Boolean(memberToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setEmail(memberToEdit.email);
      setPhone(memberToEdit.phone);
      setDepartment(memberToEdit.department);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setDepartment('');
    }
    setFieldErrors({});
    setFormError(null);
  }, [memberToEdit, isOpen]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Member name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address (e.g. student@college.edu).';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else {
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
        errors.phone = 'Please provide a valid phone number (7 to 15 digits).';
      }
    }

    if (!department.trim()) {
      errors.department = 'Department / Designation is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && memberToEdit) {
        const res = await api.updateMember(memberToEdit.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          department: department.trim(),
        });
        onSuccess(res.message || `Member "${res.data.name}" updated successfully.`);
      } else {
        const res = await api.createMember({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          department: department.trim(),
        });
        onSuccess(res.message || `Member "${res.data.name}" registered successfully.`);
      }
      onClose();
    } catch (err: any) {
      const serverMsg = extractErrorMessage(err.data, err.message);
      setFormError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 my-8 animate-in fade-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Member Record' : 'Register New Member'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update member contact and department info.' : 'Register a new student or faculty library cardholder.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="member-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Patel"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="member-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya.patel@college.edu"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="member-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="member-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.phone
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
          </div>

          {/* Department */}
          <div>
            <label htmlFor="member-department" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department / Major <span className="text-rose-500">*</span>
            </label>
            <input
              id="member-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.department
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.department && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.department}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Register Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
