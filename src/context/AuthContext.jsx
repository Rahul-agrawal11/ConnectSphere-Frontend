import { createContext, useState, useEffect, useCallback } from 'react';
import { getMyProfile } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // FIX: setLoading(false) so ProtectedRoute never stays stuck after OAuth
  const loginUser = useCallback((authResponse) => {
    localStorage.setItem('accessToken',  authResponse.accessToken);
    if (authResponse.refreshToken) {
      localStorage.setItem('refreshToken', authResponse.refreshToken);
    }
    setUser({
      id:       authResponse.userId,
      username: authResponse.username,
      email:    authResponse.email,
      role:     authResponse.role,
    });
    setLoading(false);
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchProfile();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, loginUser, logoutUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};