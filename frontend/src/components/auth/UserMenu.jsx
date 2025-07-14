import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Settings, LogOut, Key, Shield, ChevronDown } from 'lucide-react';

const UserMenu = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: User,
      action: () => {
        setIsOpen(false);
        // TODO: Navigate to profile page
        console.log('Navigate to profile');
      }
    },
    {
      label: 'API Keys',
      icon: Key,
      action: () => {
        setIsOpen(false);
        // TODO: Navigate to API keys page
        console.log('Navigate to API keys');
      }
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => {
        setIsOpen(false);
        // TODO: Navigate to settings page
        console.log('Navigate to settings');
      }
    },
  ];

  if (isAdmin()) {
    menuItems.push({
      label: 'Admin Panel',
      icon: Shield,
      action: () => {
        setIsOpen(false);
        // TODO: Navigate to admin panel
        console.log('Navigate to admin panel');
      }
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          darkMode
            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <User className="w-4 h-4" />
        </div>
        <span className="hidden sm:block">{user?.display_name || user?.username}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-1">
            {/* User info */}
            <div className={`px-4 py-3 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <p className={`text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.display_name || user?.username}
              </p>
              <p className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {user?.email}
              </p>
              {isAdmin() && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  darkMode
                    ? 'bg-blue-900/20 text-blue-400'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </span>
              )}
            </div>

            {/* Menu items */}
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </button>
            ))}

            {/* Logout */}
            <div className={`border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                  darkMode
                    ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                    : 'text-red-600 hover:text-red-700 hover:bg-gray-100'
                }`}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;