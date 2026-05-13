import apiClient from './apiClient';

const AUTH_BASE = '/api/v1/auth';

// POST /api/v1/auth/register — sends OTP
export const sendOtp = (data) =>
  apiClient.post(`${AUTH_BASE}/register`, data);
// data: { username, email, password, fullName? }

// POST /api/v1/auth/verify-otp — completes registration
export const verifyOtp = (data) =>
  apiClient.post(`${AUTH_BASE}/verify-otp`, data);
// data: { email, otp }

// POST /api/v1/auth/login
export const login = (data) =>
  apiClient.post(`${AUTH_BASE}/login`, data);
// data: { emailOrUsername, password }

// POST /api/v1/auth/refresh?refreshToken=...
export const refreshToken = (refreshToken) =>
  apiClient.post(`${AUTH_BASE}/refresh?refreshToken=${refreshToken}`);

// POST /api/v1/auth/logout (requires Bearer token)
export const logout = () =>
  apiClient.post(`${AUTH_BASE}/logout`);

// GET /api/v1/auth/profile
export const getMyProfile = () =>
  apiClient.get(`${AUTH_BASE}/profile`);

// GET /api/v1/auth/profile/:userId
export const getProfileById = (userId) =>
  apiClient.get(`${AUTH_BASE}/profile/${userId}`);

// PUT /api/v1/auth/profile
export const updateProfile = (data) =>
  apiClient.put(`${AUTH_BASE}/profile`, data);
// data: { username?, fullName?, bio?, profilePicUrl? }

// PUT /api/v1/auth/password
export const changePassword = (data) =>
  apiClient.put(`${AUTH_BASE}/password`, data);
// data: { currentPassword, newPassword }

// GET /api/v1/auth/search?query=...
export const searchUsers = (query) =>
  apiClient.get(`${AUTH_BASE}/search`, { params: { query } });

// DELETE /api/v1/auth/deactivate
export const deactivateAccount = () =>
  apiClient.delete(`${AUTH_BASE}/deactivate`);

// ── Admin ────────────────────────────────────────────
export const getAllUsers = () =>
  apiClient.get(`${AUTH_BASE}/admin/users`);

export const suspendUser = (targetUserId) =>
  apiClient.put(`${AUTH_BASE}/admin/users/${targetUserId}/suspend`);

export const reactivateUser = (targetUserId) =>
  apiClient.put(`${AUTH_BASE}/admin/users/${targetUserId}/reactivate`);

export const adminDeleteUser = (targetUserId) =>
  apiClient.delete(`${AUTH_BASE}/admin/users/${targetUserId}`);