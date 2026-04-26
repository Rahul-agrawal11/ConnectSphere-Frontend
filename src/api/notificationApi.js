import apiClient from './apiClient';

export const notificationApi = {
  getNotifications: (page = 0, size = 20) =>
    apiClient.get(`/api/v1/notifications?page=${page}&size=${size}`),

  getUnread: (page = 0, size = 20) =>
    apiClient.get(`/api/v1/notifications/unread?page=${page}&size=${size}`),

  getUnreadCount: () =>
    apiClient.get('/api/v1/notifications/unread/count'),

  markAsRead: (notificationId) =>
    apiClient.patch(`/api/v1/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiClient.patch('/api/v1/notifications/read-all'),

  deleteNotification: (notificationId) =>
    apiClient.delete(`/api/v1/notifications/${notificationId}`),

  deleteAll: () =>
    apiClient.delete('/api/v1/notifications/all'),

  sendBulk: (data) =>
    apiClient.post('/api/v1/notifications/bulk', data),
};