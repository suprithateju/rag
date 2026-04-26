import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser } from './api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have a token, we could fetch user profile here. For now, we trust the token exists.
    if (token) {
      // Decode token or fetch user to set user state. Here we'll just set it to a dummy object for UI
      setUser({ authenticated: true });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setUser({ username: data.username });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      await registerUser(username, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
