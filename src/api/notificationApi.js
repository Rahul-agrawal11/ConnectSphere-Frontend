import apiClient from './apiClient';

const NOTIF_BASE = '/api/v1/notifications';

// GET /api/v1/notifications?page=0&size=20
export const getNotifications = (page = 0, size = 20) =>
  apiClient.get(NOTIF_BASE, { params: { page, size } });

// GET /api/v1/notifications/unread?page=0&size=20
export const getUnreadNotifications = (page = 0, size = 20) =>
  apiClient.get(`${NOTIF_BASE}/unread`, { params: { page, size } });

// GET /api/v1/notifications/unread/count
export const getUnreadCount = () =>
  apiClient.get(`${NOTIF_BASE}/unread/count`);

// PATCH /api/v1/notifications/:notificationId/read
export const markAsRead = (notificationId) =>
  apiClient.patch(`${NOTIF_BASE}/${notificationId}/read`);

// PATCH /api/v1/notifications/read-all
export const markAllAsRead = () =>
  apiClient.patch(`${NOTIF_BASE}/read-all`);

// DELETE /api/v1/notifications/:notificationId
export const deleteNotification = (notificationId) =>
  apiClient.delete(`${NOTIF_BASE}/${notificationId}`);

// DELETE /api/v1/notifications/all
export const deleteAllNotifications = () =>
  apiClient.delete(`${NOTIF_BASE}/all`);