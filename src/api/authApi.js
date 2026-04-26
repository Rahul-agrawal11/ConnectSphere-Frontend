import apiClient from './apiClient';

export const authApi = {
  // ── Public ──────────────────────────────────────────────────────────────
  register: (data) =>
    apiClient.post('/api/v1/auth/register', data),

  login: (data) =>
    apiClient.post('/api/v1/auth/login', data),

  // Backend: POST /api/v1/auth/refresh?refreshToken=xxx  (query param, not body)
  refreshToken: (refreshToken) =>
    apiClient.post('/api/v1/auth/refresh', null, { params: { refreshToken } }),

  // Backend: GET /api/v1/auth/search?query=xxx  (public, no auth needed)
  searchUsers: (query) =>
    apiClient.get('/api/v1/auth/search', { params: { query } }),

  // ── Authenticated ────────────────────────────────────────────────────────
  logout: () =>
    apiClient.post('/api/v1/auth/logout'),

  getProfile: () =>
    apiClient.get('/api/v1/auth/profile'),

  getProfileById: (userId) =>
    apiClient.get(`/api/v1/auth/profile/${userId}`),

  updateProfile: (data) =>
    apiClient.put('/api/v1/auth/profile', data),

  changePassword: (data) =>
    apiClient.put('/api/v1/auth/password', data),

  deactivateAccount: () =>
    apiClient.delete('/api/v1/auth/deactivate'),

  // ── Admin ────────────────────────────────────────────────────────────────
  getAllUsers: () =>
    apiClient.get('/api/v1/auth/admin/users'),

  suspendUser: (userId) =>
    apiClient.put(`/api/v1/auth/admin/users/${userId}/suspend`),

  reactivateUser: (userId) =>
    apiClient.put(`/api/v1/auth/admin/users/${userId}/reactivate`),

  deleteUser: (userId) =>
    apiClient.delete(`/api/v1/auth/admin/users/${userId}`),
};