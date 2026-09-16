import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  BookOpen, 
  LayoutDashboard, 
  BookMarked, 
  Users, 
  PlusCircle, 
  ClipboardList, 
  Menu, 
  X,
  Server
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  apiConnected: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, apiConnected }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'books', label: 'Book Management', icon: <BookMarked className="w-4 h-4" /> },
    { id: 'members', label: 'Member Management', icon: <Users className="w-4 h-4" /> },
    { id: 'issue-book', label: 'Issue Book', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'issues', label: 'Issue Records', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="p-2 bg-indigo-600 rounded-lg shadow-sm text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white sm:text-xl">
                Library Management System
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                College Campus Library Portal
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Status & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            {/* API Connection Indicator */}
            <div 
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                apiConnected === true
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : apiConnected === false
                  ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}
              title={apiConnected ? 'Connected to Django REST Backend' : 'Backend connection pending or offline'}
            >
              <Server className="w-3.5 h-3.5" />
              <span>
                {apiConnected === true ? 'API: Online' : apiConnected === false ? 'API: Offline' : 'API: Checking...'}
              </span>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 mt-2 flex items-center justify-between text-xs text-slate-400 px-3">
            <span>Django REST Backend</span>
            <span className={apiConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {apiConnected ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
