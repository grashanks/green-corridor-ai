import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gc_user');
    return saved ? JSON.parse(saved) : { username: 'admin', role: 'Traffic Administrator' };
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const resp = await authAPI.login(username, password);
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('gc_token', access_token);
      localStorage.setItem('gc_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.detail || 'Invalid credentials'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
