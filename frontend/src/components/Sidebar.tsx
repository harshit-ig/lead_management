import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Upload,
  TrendingUp,
  Settings,
  UserCheck,
  FileSpreadsheet,
  Target
} from 'lucide-react';
import type { NavItem } from '../types';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'All Leads', href: '/leads', icon: ClipboardList, adminOnly: true },
    { name: 'My Leads', href: '/my-leads', icon: Target },
    { name: 'Add Lead', href: '/leads/new', icon: UserPlus },
    { name: 'Import Leads', href: '/leads/import', icon: Upload, adminOnly: true },
    { name: 'Assign Leads', href: '/leads/assign', icon: FileSpreadsheet, adminOnly: true },
    { name: 'User Management', href: '/users', icon: UserCheck, adminOnly: true },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`sidebar ${isOpen ? 'open' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Lead Manager</h1>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Admin Panel' : 'User Panel'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/leads"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => {
                  // Close mobile sidebar when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            <p className="font-medium">Lead Manager v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
