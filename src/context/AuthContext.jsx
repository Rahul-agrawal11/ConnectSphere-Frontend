import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise user and token from localStorage on first render
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cs_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem('cs_token') || null
  );

  // ── Email / Password login ───────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    // credentials = { emailOrUsername, password }
    const res = await authApi.login(credentials);
    // Backend: ApiResponse<AuthResponse>.data
    const data = res.data.data;
    const { accessToken, refreshToken, userId, username, email, role } = data;

    const userObj = { userId, username, email, role };

    localStorage.setItem('cs_token',   accessToken);
    localStorage.setItem('cs_refresh', refreshToken);
    localStorage.setItem('cs_user',    JSON.stringify(userObj));

    setToken(accessToken);
    setUser(userObj);
    return userObj;
  }, []);

  // ── OAuth2 success (called by OAuth2Redirect page) ───────────────────────
  // Token is already in localStorage when this is called.
  const handleOAuthSuccess = useCallback((accessToken, userObj) => {
    setToken(accessToken);
    setUser(userObj);
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    // Returns ApiResponse<UserProfileResponse>
    const res = await authApi.register(formData);
    return res.data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Backend invalidates the refresh token stored in DB
      await authApi.logout();
    } catch {
      // Always clear local state even if backend call fails
    }
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_refresh');
    localStorage.removeItem('cs_user');
    setToken(null);
    setUser(null);
  }, []);

  // ── Update user fields in context + localStorage ─────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('cs_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin         = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      updateUser,
      handleOAuthSuccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};