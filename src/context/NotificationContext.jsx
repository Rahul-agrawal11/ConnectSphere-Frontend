import React, {
  createContext, useContext, useState,
  useEffect, useCallback
} from 'react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.data || 0);
    } catch {}
  }, [isAuthenticated]);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const decrementCount = (by = 1) =>
    setUnreadCount(prev => Math.max(0, prev - by));

  const resetCount = () => setUnreadCount(0);

  return (
    <NotificationContext.Provider value={{
      unreadCount, fetchUnreadCount, decrementCount, resetCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);