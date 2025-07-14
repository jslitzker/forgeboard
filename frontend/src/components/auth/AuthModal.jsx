import React, { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen, onClose, darkMode, initialMode = 'login' }) => {
  const [currentMode, setCurrentMode] = useState(initialMode);

  if (!isOpen) return null;

  const handleSwitchToLogin = () => {
    setCurrentMode('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentMode('register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-opacity-10 transition-colors ${
            darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-black'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {currentMode === 'login' ? (
            <LoginForm
              onClose={onClose}
              onSwitchToRegister={handleSwitchToRegister}
              darkMode={darkMode}
            />
          ) : (
            <RegisterForm
              onClose={onClose}
              onSwitchToLogin={handleSwitchToLogin}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;