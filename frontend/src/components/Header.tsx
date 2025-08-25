import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  return (
    <header className="header">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10 w-80"
              placeholder="Search leads, companies, or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          type="button"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </span>
        </button>

        {/* User profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className="flex items-center gap-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 capitalize mt-1">
                  {user?.role} Account
                </p>
              </div>
              
              <div className="py-1">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    // TODO: Navigate to profile page
                  }}
                >
                  <User className="w-4 h-4" />
                  View Profile
                </button>
                
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setIsProfileOpen(false);
                      // TODO: Navigate to settings page
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                )}
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
