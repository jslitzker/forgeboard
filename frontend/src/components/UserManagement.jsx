import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Users, UserPlus, Shield, Mail, Calendar, MoreVertical, Trash2, Edit, UserCheck, UserX } from 'lucide-react';

const UserManagement = ({ darkMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState(null);
  
  const { makeAuthenticatedRequest, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
      fetchStats();
    } else {
      setError('Admin access required');
      setLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/auth/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await makeAuthenticatedRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        fetchUsers();
        fetchStats();
        setShowCreateForm(false);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to create user' };
      }
    } catch (err) {
      return { success: false, error: 'Error creating user' };
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Shield className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Admin Access Required
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          You need administrator privileges to access user management.
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
            User Management
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.users.total}
                </p>
              </div>
              <Users className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </Card>

          <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
                <p className={`text-2xl font-bold text-green-600`}>
                  {stats.users.active}
                </p>
              </div>
              <UserCheck className={`h-8 w-8 text-green-600`} />
            </div>
          </Card>

          <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Admins</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.users.admin}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </Card>

          <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Recent Logins</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.users.recent_logins}
                </p>
              </div>
              <Calendar className={`h-8 w-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </Card>
        </div>
      )}

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

      {/* Users Table */}
      <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left px-6 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  User
                </th>
                <th className={`text-left px-6 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Provider
                </th>
                <th className={`text-left px-6 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Role
                </th>
                <th className={`text-left px-6 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Status
                </th>
                <th className={`text-left px-6 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Last Login
                </th>
                <th className={`text-left px-6 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.display_name}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.email}
                        </div>
                        {user.username && (
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            @{user.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.auth_provider === 'local'
                        ? (darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800')
                        : (darkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-800')
                    }`}>
                      {user.auth_provider === 'local' ? 'Local' : 'Azure AD'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_admin
                        ? (darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800')
                        : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800')
                    }`}>
                      {user.is_admin ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        'User'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? (darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800')
                        : (darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800')
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        onClick={() => {
                          // TODO: Implement edit user
                          console.log('Edit user:', user.id);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                        onClick={() => {
                          // TODO: Implement delete user
                          console.log('Delete user:', user.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Form Modal */}
      {showCreateForm && (
        <CreateUserModal
          darkMode={darkMode}
          onClose={() => setShowCreateForm(false)}
          onCreateUser={createUser}
        />
      )}
    </div>
  );
};

// Simple create user modal component
const CreateUserModal = ({ darkMode, onClose, onCreateUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await onCreateUser(formData);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create New User
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
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                autoComplete="new-password"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_admin"
                checked={formData.is_admin}
                onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="is_admin" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Administrator
              </label>
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
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;