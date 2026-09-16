import React from 'react';
import { AlertNotification } from '../types';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface AlertBannerProps {
  notification: AlertNotification | null;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div
      role="alert"
      className={`rounded-lg p-4 mb-6 border shadow-sm flex items-start justify-between transition-all ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
          : isError
          ? 'bg-rose-50 text-rose-950 border-rose-300'
          : 'bg-blue-50 text-blue-900 border-blue-200'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {isError && <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-600" />}
        </div>
        <div>
          <p className="font-semibold text-sm leading-snug">
            {notification.message}
          </p>
          {notification.details && (
            <p className="mt-1 text-xs opacity-90 font-mono bg-white/60 p-1.5 rounded border border-current/10 whitespace-pre-wrap">
              {notification.details}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 ml-4 p-1 rounded-md hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
