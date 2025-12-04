import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.base}/api/auth/check`, {
        withCredentials: true
      });
      
      if (response.data.authenticated) {
        setAuthenticated(true);
        setUser(response.data.user);
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_ENDPOINTS.base}/api/auth/logout`, {}, {
        withCredentials: true
      });
      setAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    authenticated,
    loading,
    checkAuth,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

