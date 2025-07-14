import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Users, Key, Shield, Bell, RefreshCw, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import UserManagement from './UserManagement';
import ApiKeyManagement from './ApiKeyManagement';
import SSLManagement from './SSLManagement';
import Settings from './Settings';

const SettingsWithAuth = ({ darkMode, setDarkMode }) => {
  const [activeTab, setActiveTab] = useState('general');
  const { isAuthenticated, isAdmin } = useAuth();

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    ...(isAuthenticated() ? [
      { id: 'api-keys', label: 'API Keys', icon: Key },
    ] : []),
    ...(isAdmin() ? [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'ssl', label: 'SSL Certificates', icon: Shield },
    ] : []),
  ];

  const TabButton = ({ tab, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600')
          : (darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
      }`}
    >
      <tab.icon className="w-4 h-4" />
      <span>{tab.label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Settings
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure your ForgeBoard preferences and manage your account
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <Settings darkMode={darkMode} setDarkMode={setDarkMode} />
        )}
        
        {activeTab === 'api-keys' && isAuthenticated() && (
          <ApiKeyManagement darkMode={darkMode} />
        )}
        
        {activeTab === 'users' && isAdmin() && (
          <UserManagement darkMode={darkMode} />
        )}
        
        {activeTab === 'ssl' && isAdmin() && (
          <SSLManagement darkMode={darkMode} />
        )}
      </div>
    </div>
  );
};

export default SettingsWithAuth;