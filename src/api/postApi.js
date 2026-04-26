import apiClient from './apiClient';

export const postApi = {
  // ── Create ────────────────────────────────────────────────────────────────
  // Backend DTO: { content, mediaUrls?, visibility? }
  createPost: (data) =>
    apiClient.post('/api/v1/posts', data),

  // ── Read ──────────────────────────────────────────────────────────────────
  getPostById: (postId) =>
    apiClient.get(`/api/v1/posts/${postId}`),

  getPublicFeed: (page = 0, size = 10) =>
    apiClient.get('/api/v1/posts/public', { params: { page, size } }),

  // Backend: GET /api/v1/posts/feed?followedUserIds=1&followedUserIds=2&...
  // Spring's @RequestParam List<Long> requires repeated params, not CSV
  getFeed: (followedUserIds = [], page = 0, size = 10) => {
    const params = new URLSearchParams();
    followedUserIds.forEach(id => params.append('followedUserIds', id));
    params.append('page', page);
    params.append('size', size);
    return apiClient.get(`/api/v1/posts/feed?${params.toString()}`);
  },

  getPostsByUser: (authorId, page = 0, size = 10) =>
    apiClient.get(`/api/v1/posts/user/${authorId}`, { params: { page, size } }),

  searchPosts: (keyword, page = 0, size = 10) =>
    apiClient.get('/api/v1/posts/search', { params: { keyword, page, size } }),

  getPostCount: (authorId) =>
    apiClient.get(`/api/v1/posts/count/${authorId}`),

  // ── Update ────────────────────────────────────────────────────────────────
  // Backend DTO: { content?, mediaUrls?, visibility? }
  updatePost: (postId, data) =>
    apiClient.put(`/api/v1/posts/${postId}`, data),

  // Backend: PATCH /api/v1/posts/{postId}/visibility?visibility=PUBLIC
  changeVisibility: (postId, visibility) =>
    apiClient.patch(`/api/v1/posts/${postId}/visibility`, null, {
      params: { visibility },
    }),

  // ── Delete ────────────────────────────────────────────────────────────────
  deletePost: (postId) =>
    apiClient.delete(`/api/v1/posts/${postId}`),

  // Backend: DELETE /api/v1/posts/admin/{postId}  (checks X-User-Role header via gateway)
  adminDeletePost: (postId) =>
    apiClient.delete(`/api/v1/posts/admin/${postId}`),
};