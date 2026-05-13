import apiClient from './apiClient';

// ── User Management ───────────────────────────────────────────────────────

/**
 * GET /api/v1/auth/admin/users
 * Returns all registered users. Admin only.
 */
export const getAllUsers = () =>
    apiClient.get('/api/v1/auth/admin/users');

/**
 * PUT /api/v1/auth/admin/users/{userId}/suspend
 */
export const suspendUser = (userId) =>
    apiClient.put(`/api/v1/auth/admin/users/${userId}/suspend`);

/**
 * PUT /api/v1/auth/admin/users/{userId}/reactivate
 */
export const reactivateUser = (userId) =>
    apiClient.put(`/api/v1/auth/admin/users/${userId}/reactivate`);

/**
 * DELETE /api/v1/auth/admin/users/{userId}
 */
export const deleteUser = (userId) =>
    apiClient.delete(`/api/v1/auth/admin/users/${userId}`);

// ── Post Management ───────────────────────────────────────────────────────

/**
 * GET /api/v1/posts/admin?page=0&size=20
 * Get all posts paginated — admin can browse all content.
 */
export const getAllPosts = (page = 0, size = 20) =>
  apiClient.get('/api/v1/posts/admin/all', { params: { page, size } });

/**
 * DELETE /api/v1/posts/admin/{postId}
 * Force-delete any post as admin.
 */
export const adminDeletePost = (postId) =>
    apiClient.delete(`/api/v1/posts/admin/${postId}`, {
        headers: { 'X-User-Role': 'ADMIN' },
    });

// ── Comment Management ─────────────────────────────────────────────────────

/**
 * DELETE /api/v1/comments/admin/{commentId}
 * Force-delete any comment as admin.
 */
export const adminDeleteComment = (commentId) =>
    apiClient.delete(`/api/v1/comments/admin/${commentId}`);

// ── Broadcast Notification ─────────────────────────────────────────────────

/**
 * POST /api/v1/notifications/bulk
 * Send a platform-wide broadcast notification.
 * @param {number[]} recipientIds  — empty array means all users
 * @param {string}   message
 */
export const sendBroadcast = (recipientIds, message) =>
    apiClient.post('/api/v1/notifications/bulk', { recipientIds, message });