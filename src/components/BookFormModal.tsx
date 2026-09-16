import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { api, extractErrorMessage } from '../services/api';
import { X, BookPlus, Edit3, AlertCircle } from 'lucide-react';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  bookToEdit?: Book | null;
  existingCategories: string[];
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookToEdit,
  existingCategories,
}) => {
  const isEditing = Boolean(bookToEdit);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isbn, setIsbn] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [availableQuantity, setAvailableQuantity] = useState<number>(1);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author);
      setCategory(bookToEdit.category);
      setCustomCategory('');
      setIsbn(bookToEdit.isbn);
      setQuantity(bookToEdit.quantity);
      setAvailableQuantity(bookToEdit.available_quantity);
    } else {
      setTitle('');
      setAuthor('');
      setCategory(existingCategories.length > 0 ? existingCategories[0] : '');
      setCustomCategory('');
      setIsbn('');
      setQuantity(1);
      setAvailableQuantity(1);
    }
    setFieldErrors({});
    setFormError(null);
  }, [bookToEdit, isOpen, existingCategories]);

  // When adding a new book, when total quantity changes, sync available quantity by default
  const handleQuantityChange = (val: number) => {
    setQuantity(val);
    if (!isEditing) {
      setAvailableQuantity(val);
    } else {
      // In edit mode, if available exceeds new total, clamp it
      if (availableQuantity > val) {
        setAvailableQuantity(val);
      }
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Book title is required.';
    }

    if (!author.trim()) {
      errors.author = 'Author name is required.';
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      errors.category = 'Book category is required.';
    }

    if (!isbn.trim()) {
      errors.isbn = 'ISBN is required.';
    }

    if (quantity === undefined || quantity === null || Number.isNaN(quantity) || quantity < 0) {
      errors.quantity = 'Total quantity must be a non-negative number.';
    }

    if (
      availableQuantity === undefined ||
      availableQuantity === null ||
      Number.isNaN(availableQuantity) ||
      availableQuantity < 0
    ) {
      errors.available_quantity = 'Available quantity cannot be negative.';
    } else if (availableQuantity > quantity) {
      errors.available_quantity = 'Available quantity cannot exceed total quantity.';
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

    const finalCategory = category === '__custom__' ? customCategory.trim() : category.trim();

    setIsSubmitting(true);
    try {
      if (isEditing && bookToEdit) {
        const res = await api.updateBook(bookToEdit.id, {
          title: title.trim(),
          author: author.trim(),
          category: finalCategory,
          isbn: isbn.trim(),
          quantity: Number(quantity),
          available_quantity: Number(availableQuantity),
        });
        onSuccess(res.message || `Book "${res.data.title}" updated successfully.`);
      } else {
        const res = await api.createBook({
          title: title.trim(),
          author: author.trim(),
          category: finalCategory,
          isbn: isbn.trim(),
          quantity: Number(quantity),
          available_quantity: Number(availableQuantity),
        });
        onSuccess(res.message || `Book "${res.data.title}" added successfully.`);
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
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 my-8 animate-in fade-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <BookPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Book Record' : 'Add New Book'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update book details and inventory counts.' : 'Enter book information to add to the library catalog.'}
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
          {/* Title */}
          <div>
            <label htmlFor="book-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Book Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Algorithms"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.title
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>}
          </div>

          {/* Author */}
          <div>
            <label htmlFor="book-author" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Author <span className="text-rose-500">*</span>
            </label>
            <input
              id="book-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Thomas H. Cormen"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                fieldErrors.author
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.author && <p className="mt-1 text-xs text-rose-600">{fieldErrors.author}</p>}
          </div>

          {/* Category & ISBN (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label htmlFor="book-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category / Genre <span className="text-rose-500">*</span>
              </label>
              <select
                id="book-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  fieldErrors.category
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
              >
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Enter custom category</option>
              </select>
              {category === '__custom__' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="New category name"
                  className="mt-2 w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              )}
              {fieldErrors.category && <p className="mt-1 text-xs text-rose-600">{fieldErrors.category}</p>}
            </div>

            {/* ISBN */}
            <div>
              <label htmlFor="book-isbn" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ISBN <span className="text-rose-500">*</span>
              </label>
              <input
                id="book-isbn"
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 978-0262033848"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.isbn
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.isbn && <p className="mt-1 text-xs text-rose-600">{fieldErrors.isbn}</p>}
            </div>
          </div>

          {/* Quantities (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Total Quantity */}
            <div>
              <label htmlFor="book-quantity" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Copies <span className="text-rose-500">*</span>
              </label>
              <input
                id="book-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 0)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.quantity
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.quantity && <p className="mt-1 text-xs text-rose-600">{fieldErrors.quantity}</p>}
            </div>

            {/* Available Quantity */}
            <div>
              <label htmlFor="book-available-qty" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Available Copies <span className="text-rose-500">*</span>
              </label>
              <input
                id="book-available-qty"
                type="number"
                min="0"
                max={quantity}
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(parseInt(e.target.value, 10) || 0)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  fieldErrors.available_quantity
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.available_quantity && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.available_quantity}</p>
              )}
            </div>
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
              <span>{isEditing ? 'Update Book' : 'Add Book'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
