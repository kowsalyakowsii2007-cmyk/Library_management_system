import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, AlertNotification } from './types';
import { api, API_BASE_URL } from './services/api';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { DashboardView } from './components/DashboardView';
import { BookManagementView } from './components/BookManagementView';
import { MemberManagementView } from './components/MemberManagementView';
import { IssueBookView } from './components/IssueBookView';
import { IssueRecordsView } from './components/IssueRecordsView';
import { Server, Database, Code2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [notification, setNotification] = useState<AlertNotification | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Check API connectivity on load
  const checkApiHealth = useCallback(async () => {
    try {
      await api.getDashboardStats();
      setApiConnected(true);
    } catch {
      setApiConnected(false);
    }
  }, []);

  useEffect(() => {
    checkApiHealth();
    // Periodically re-check health every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, [checkApiHealth]);

  const notify = (type: 'success' | 'error' | 'info', message: string, details?: string) => {
    const id = Date.now().toString();
    setNotification({ id, type, message, details });
    // Scroll to top to ensure user sees notice
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-dismiss success and info notices after 6 seconds
    if (type !== 'error') {
      setTimeout(() => {
        setNotification((curr) => (curr?.id === id ? null : curr));
      }, 6000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiConnected={apiConnected} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Global Notification Alert Banner */}
        <AlertBanner
          notification={notification}
          onDismiss={() => setNotification(null)}
        />

        {/* Backend Offline Warning Banner */}
        {apiConnected === false && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold flex items-center space-x-1.5">
                <span>Connecting to Django REST API...</span>
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Target Backend: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{API_BASE_URL || 'http://127.0.0.1:8000'}</code>.
                Make sure the Django server is running (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">python manage.py runserver 8000</code>).
              </p>
            </div>
            <button
              onClick={checkApiHealth}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
            >
              Check Connection Again
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'books' && (
          <BookManagementView
            onNotify={notify}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'members' && (
          <MemberManagementView
            onNotify={notify}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'issue-book' && (
          <IssueBookView
            onNotify={notify}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'issues' && (
          <IssueRecordsView
            onNotify={notify}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* College Project Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Library Management System</span>
            <span>•</span>
            <span>Academic Student Project</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1" title="Backend Framework">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>Django REST Framework</span>
            </span>
            <span className="flex items-center space-x-1" title="Relational Database">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite</span>
            </span>
            <span className="flex items-center space-x-1" title="Frontend Framework">
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>React 19 + Vite</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
