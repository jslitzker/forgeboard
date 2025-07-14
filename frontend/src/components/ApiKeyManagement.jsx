import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Calendar, Shield } from 'lucide-react';

const ApiKeyManagement = ({ darkMode }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState({});
  
  const { getApiKeys, createApiKey, revokeApiKey, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchApiKeys();
    }
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      setError('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (keyData) => {
    try {
      const result = await createApiKey(keyData.name, keyData.permissions, keyData.expires_days);
      
      if (result.success !== false) {
        fetchApiKeys();
        setShowCreateForm(false);
        // Show the created key
        alert(`API Key created successfully!\n\nKey: ${result.api_key}\n\nPlease save this key securely. You won't be able to see it again.`);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to create API key' };
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await revokeApiKey(keyId);
      if (result.success) {
        fetchApiKeys();
      } else {
        alert('Failed to revoke API key');
      }
    } catch (err) {
      alert('Error revoking API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const toggleKeyVisibility = (keyId) => {
    setShowKeyValue(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  if (!isAuthenticated()) {
    return (
      <div className="text-center py-12">
        <Key className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Authentication Required
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Please log in to manage your API keys.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            API Keys
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your API keys for programmatic access
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border ${
          darkMode 
            ? 'bg-red-900/20 border-red-800 text-red-400' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card className={`p-12 text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Key className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No API Keys
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You haven't created any API keys yet.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>
                      <Key className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {key.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-4 h-4 mr-1" />
                          Created {new Date(key.created_at).toLocaleDateString()}
                        </span>
                        {key.expires_at && (
                          <span className={`flex items-center ${
                            new Date(key.expires_at) < new Date() 
                              ? 'text-red-500' 
                              : (darkMode ? 'text-yellow-400' : 'text-yellow-600')
                          }`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            Expires {new Date(key.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {key.last_used_at && (
                          <span className={`flex items-center ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                            Last used {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Permissions */}
                  <div className="mt-3 flex items-center space-x-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Permissions:
                    </span>
                    {key.permissions.map((permission, index) => (
                      <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        permission === 'admin' 
                          ? (darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800')
                          : (darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800')
                      }`}>
                        {permission === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {permission}
                      </span>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      key.is_valid
                        ? (darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800')
                        : (darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800')
                    }`}>
                      {key.is_valid ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeKey(key.id)}
                    className={`${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create API Key Form Modal */}
      {showCreateForm && (
        <CreateApiKeyModal
          darkMode={darkMode}
          onClose={() => setShowCreateForm(false)}
          onCreateKey={handleCreateKey}
        />
      )}
    </div>
  );
};

// Create API Key Modal Component
const CreateApiKeyModal = ({ darkMode, onClose, onCreateKey }) => {
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read'],
    expires_days: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availablePermissions = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'admin', label: 'Admin' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await onCreateKey(formData);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create API Key
          </h2>
          
          {error && (
            <div className={`p-3 rounded-lg mb-4 ${
              darkMode 
                ? 'bg-red-900/20 border border-red-800 text-red-400' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., CI/CD Pipeline"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Permissions
              </label>
              <div className="space-y-2">
                {availablePermissions.map((permission) => (
                  <div key={permission.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onChange={() => handlePermissionChange(permission.value)}
                      className="mr-2"
                    />
                    <label 
                      htmlFor={permission.value} 
                      className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Expires in (days)
              </label>
              <input
                type="number"
                value={formData.expires_days}
                onChange={(e) => setFormData({...formData, expires_days: parseInt(e.target.value) || 0})}
                min="1"
                max="365"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Leave as 0 for no expiration
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create API Key'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManagement;