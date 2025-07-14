import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));

  // API base URL
  const API_BASE = '/api';

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token refresh if needed
      if (response.status === 401 && refreshToken) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          // Retry the original request with new token
          headers.Authorization = `Bearer ${token}`;
          return fetch(url, {
            ...options,
            headers,
          });
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Set user data
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  };

  // Refresh token function
  const refreshAuthToken = async () => {
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update tokens
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens if refresh fails
      logout();
      return false;
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    if (!token) return null;

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/auth/me`);
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password change failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: error.message };
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset request failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message };
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get API keys
  const getApiKeys = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/me/api-keys`);
      
      if (!response.ok) {
        throw new Error('Failed to get API keys');
      }

      return await response.json();
    } catch (error) {
      console.error('Get API keys error:', error);
      return [];
    }
  };

  // Create API key
  const createApiKey = async (name, permissions = null, expiresInDays = null) => {
    try {
      const requestBody = { name };
      if (permissions) requestBody.permissions = permissions;
      if (expiresInDays) requestBody.expires_days = expiresInDays;

      const response = await makeAuthenticatedRequest(`${API_BASE}/me/api-keys`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create API key');
      }

      return await response.json();
    } catch (error) {
      console.error('Create API key error:', error);
      return { success: false, error: error.message };
    }
  };

  // Revoke API key
  const revokeApiKey = async (keyId) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/me/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke API key');
      }

      return { success: true };
    } catch (error) {
      console.error('Revoke API key error:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.is_admin;
  };

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        const userData = await getCurrentUser();
        if (!userData) {
          // If we can't get user data, clear tokens
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Set up token refresh timer
  useEffect(() => {
    if (token && refreshToken) {
      // Refresh token every 30 minutes
      const interval = setInterval(() => {
        refreshAuthToken();
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [token, refreshToken]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    getCurrentUser,
    changePassword,
    requestPasswordReset,
    resetPassword,
    getApiKeys,
    createApiKey,
    revokeApiKey,
    isAuthenticated,
    isAdmin,
    makeAuthenticatedRequest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;