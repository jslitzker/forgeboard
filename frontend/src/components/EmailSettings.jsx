import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Send, CheckCircle, AlertCircle, Eye, EyeOff, Save, TestTube, HelpCircle, ExternalLink, Terminal, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const Tooltip = ({ content, children, darkMode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && (
        <div className={`absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs bottom-full left-1/2 transform -translate-x-1/2 mb-1 ${
          darkMode 
            ? 'bg-gray-800 text-gray-200 border border-gray-600' 
            : 'bg-gray-900 text-white'
        }`}>
          {content}
          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
            darkMode ? 'border-t-gray-800' : 'border-t-gray-900'
          }`} />
        </div>
      )}
    </div>
  );
};

const EmailSettings = ({ darkMode }) => {
  const { makeAuthenticatedRequest, isAdmin } = useAuth();
  const [config, setConfig] = useState({
    enabled: false,
    provider: 'smtp',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
    smtp_use_ssl: false,
    from_email: '',
    from_name: 'ForgeBoard',
    // Microsoft 365 OAuth2 settings
    tenant_id: '',
    client_id: '',
    client_secret: '',
    scope: 'https://graph.microsoft.com/.default'
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    smtp_password: false,
    client_secret: false
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      fetchEmailConfig();
      
      // Check if URL hash contains #logs to auto-show logs
      if (window.location.hash.includes('logs')) {
        setShowLogs(true);
        fetchLogs();
      }
    }
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/email/config');
      if (response.ok) {
        const data = await response.json();
        // Don't overwrite password fields with "REDACTED" - keep them empty for user input
        const cleanData = { ...data };
        if (cleanData.smtp_password === 'REDACTED') {
          cleanData.smtp_password = '';
        }
        if (cleanData.client_secret === 'REDACTED') {
          cleanData.client_secret = '';
        }
        setConfig(prev => ({ ...prev, ...cleanData }));
      }
    } catch (error) {
      showMessage('Failed to load email configuration', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await makeAuthenticatedRequest('/api/admin/email/config', {
        method: 'POST',
        body: JSON.stringify(config)
      });

      if (response.ok) {
        showMessage('Email configuration saved successfully', 'success');
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to save configuration', 'error');
      }
    } catch (error) {
      showMessage('Failed to save email configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfig = async () => {
    setTesting(true);
    try {
      const response = await makeAuthenticatedRequest('/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(config)
      });

      if (response.ok) {
        showMessage('Email test successful! Check your inbox.', 'success');
      } else {
        const error = await response.json();
        showMessage(error.message || 'Email test failed', 'error');
      }
      
      // Auto-fetch logs after testing
      setTimeout(() => {
        fetchLogs();
      }, 1000);
    } catch (error) {
      showMessage('Failed to test email configuration', 'error');
    } finally {
      setTesting(false);
    }
  };

  const fetchLogs = async (lines = 50) => {
    setLogsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/logs?lines=${lines}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        if (!showLogs) {
          setShowLogs(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatLogLevel = (level) => {
    const levelMap = {
      '3': 'ERROR',
      '4': 'WARNING', 
      '5': 'NOTICE',
      '6': 'INFO',
      '7': 'DEBUG'
    };
    return levelMap[level] || 'INFO';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      // Convert microseconds to milliseconds
      const ms = parseInt(timestamp) / 1000;
      return new Date(ms).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Mail className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Admin Access Required
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          You need administrator privileges to manage email configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Email Configuration
        </h2>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure email notifications for password resets and user management
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          messageType === 'success' 
            ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
            : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable Email */}
        <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <div>
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Email Notifications
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enable email notifications for password resets and user activities
              </p>
            </div>
            <div className="ml-auto">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  config.enabled 
                    ? 'bg-blue-600' 
                    : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>
          </div>
        </Card>

        {config.enabled && (
          <>
            {/* Provider Selection */}
            <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="space-y-4">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Email Provider
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    config.provider === 'smtp'
                      ? (darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                      : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                  }`}>
                    <input
                      type="radio"
                      name="provider"
                      value="smtp"
                      checked={config.provider === 'smtp'}
                      onChange={(e) => handleInputChange('provider', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Send className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        SMTP
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Standard email server
                      </div>
                    </div>
                  </label>
                  
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    config.provider === 'oauth2'
                      ? (darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                      : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                  }`}>
                    <input
                      type="radio"
                      name="provider"
                      value="oauth2"
                      checked={config.provider === 'oauth2'}
                      onChange={(e) => handleInputChange('provider', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Microsoft 365
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        OAuth2 with Graph API
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            {/* SMTP Configuration */}
            {config.provider === 'smtp' && (
              <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    SMTP Configuration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={config.smtp_host}
                        onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={config.smtp_port}
                        onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                        placeholder="587"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Username
                    </label>
                    <input
                      type="email"
                      value={config.smtp_username}
                      onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                      placeholder="your-email@example.com"
                      autoComplete="email"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.smtp_password ? 'text' : 'password'}
                        value={config.smtp_password}
                        onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                        placeholder="Your email password or app password"
                        autoComplete="current-password"
                        className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('smtp_password')}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {showPasswords.smtp_password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.smtp_use_tls}
                        onChange={(e) => handleInputChange('smtp_use_tls', e.target.checked)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Use TLS
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.smtp_use_ssl}
                        onChange={(e) => handleInputChange('smtp_use_ssl', e.target.checked)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Use SSL
                      </span>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* Microsoft 365 OAuth2 Configuration */}
            {config.provider === 'oauth2' && (
              <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Microsoft 365 OAuth2 Configuration
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Configure Azure AD application credentials for Microsoft 365 email integration
                  </p>

                  <div>
                    <label className={`flex items-center text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tenant ID
                      <Tooltip
                        content="Found in Azure AD → Overview → Directory (tenant) ID. This identifies your organization's Azure Active Directory."
                        darkMode={darkMode}
                      >
                        <HelpCircle className="w-4 h-4 ml-1 cursor-help opacity-60 hover:opacity-100" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={config.tenant_id}
                      onChange={(e) => handleInputChange('tenant_id', e.target.value)}
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`flex items-center text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Client ID (Application ID)
                      <Tooltip
                        content="Found in Azure AD → App registrations → [Your App] → Overview → Application (client) ID. This identifies your registered application."
                        darkMode={darkMode}
                      >
                        <HelpCircle className="w-4 h-4 ml-1 cursor-help opacity-60 hover:opacity-100" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={config.client_id}
                      onChange={(e) => handleInputChange('client_id', e.target.value)}
                      placeholder="87654321-4321-4321-4321-210987654321"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`flex items-center text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Client Secret
                      <Tooltip
                        content="Generated in Azure AD → App registrations → [Your App] → Certificates & secrets → New client secret. Store securely - this is only shown once!"
                        darkMode={darkMode}
                      >
                        <HelpCircle className="w-4 h-4 ml-1 cursor-help opacity-60 hover:opacity-100" />
                      </Tooltip>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.client_secret ? 'text' : 'password'}
                        value={config.client_secret}
                        onChange={(e) => handleInputChange('client_secret', e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        autoComplete="off"
                        className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('client_secret')}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {showPasswords.client_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Scope
                    </label>
                    <input
                      type="text"
                      value={config.scope}
                      onChange={(e) => handleInputChange('scope', e.target.value)}
                      placeholder="https://graph.microsoft.com/.default"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          <strong>Quick Setup:</strong><br />
                          1. Register an app in Azure AD portal<br />
                          2. Add Mail.Send API permission with admin consent<br />
                          3. Create a client secret (expires in 24 months)<br />
                          4. Copy the tenant ID, client ID, and client secret here
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Navigate to documentation and then to email config section
                          window.location.hash = 'docs';
                          setTimeout(() => {
                            // Try to navigate to email-config section after docs loads
                            const url = new URL(window.location);
                            url.searchParams.set('section', 'system-admin');
                            url.searchParams.set('content', 'email-config');
                            window.history.replaceState({}, '', url);
                            window.dispatchEvent(new HashChangeEvent('hashchange'));
                          }, 100);
                        }}
                        className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                          darkMode 
                            ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <span>Full Guide</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Sender Information */}
            <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="space-y-4">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Sender Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      From Email
                    </label>
                    <input
                      type="email"
                      value={config.from_email}
                      onChange={(e) => handleInputChange('from_email', e.target.value)}
                      placeholder="noreply@example.com"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      From Name
                    </label>
                    <input
                      type="text"
                      value={config.from_name}
                      onChange={(e) => handleInputChange('from_name', e.target.value)}
                      placeholder="ForgeBoard"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={testEmailConfig}
                disabled={testing || !config.enabled}
                className="flex items-center space-x-2"
              >
                <TestTube className="w-4 h-4" />
                <span>{testing ? 'Testing...' : 'Test Email'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center space-x-2"
              >
                <Terminal className="w-4 h-4" />
                <span>{showLogs ? 'Hide Logs' : 'Show Logs'}</span>
              </Button>
            </div>

            {/* Backend Logs Section */}
            {showLogs && (
              <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Terminal className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Backend Logs
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs()}
                    disabled={logsLoading}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>

                <div className={`bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto ${
                  darkMode ? 'border border-gray-600' : 'border border-gray-300'
                }`}>
                  {logsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-6 h-6 animate-spin text-green-400" />
                      <span className="ml-2">Loading logs...</span>
                    </div>
                  ) : logs.length > 0 ? (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="flex space-x-2 text-xs">
                          <span className="text-gray-500 whitespace-nowrap">
                            {formatTimestamp(log.timestamp) || 'N/A'}
                          </span>
                          <span className={`font-bold uppercase ${
                            formatLogLevel(log.level) === 'ERROR' ? 'text-red-400' :
                            formatLogLevel(log.level) === 'WARNING' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`}>
                            [{formatLogLevel(log.level)}]
                          </span>
                          <span className="text-green-400 break-all">
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No logs available</p>
                        <p className="text-xs mt-1">Click "Test Email" to generate logs</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    <strong>Debug Info:</strong> These logs show backend OAuth2 and SMTP operations. 
                    Look for "Graph API" entries to debug Microsoft 365 issues, or "SMTP" entries for email server problems.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default EmailSettings;