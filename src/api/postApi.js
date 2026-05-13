import apiClient from './apiClient';

const POSTS_BASE = '/api/v1/posts';

// POST /api/v1/posts
export const createPost = (data) =>
  apiClient.post(POSTS_BASE, data);
// data: { content, mediaUrls?, visibility? }

// GET /api/v1/posts/:postId
export const getPostById = (postId) =>
  apiClient.get(`${POSTS_BASE}/${postId}`);

// GET /api/v1/posts/public?page=0&size=10
export const getPublicFeed = (page = 0, size = 10) =>
  apiClient.get(`${POSTS_BASE}/public`, { params: { page, size } });

// GET /api/v1/posts/feed?followedUserIds=1,2,3&page=0&size=10
export const getPersonalFeed = (followedUserIds, page = 0, size = 10) =>
  apiClient.get(`${POSTS_BASE}/feed`, {
    params: { followedUserIds: followedUserIds.join(','), page, size },
  });

// GET /api/v1/posts/user/:authorId?page=0&size=10
export const getPostsByUser = (authorId, page = 0, size = 10) =>
  apiClient.get(`${POSTS_BASE}/user/${authorId}`, { params: { page, size } });

// GET /api/v1/posts/search?keyword=...&page=0&size=10
export const searchPosts = (keyword, page = 0, size = 10) =>
  apiClient.get(`${POSTS_BASE}/search`, { params: { keyword, page, size } });

// GET /api/v1/posts/count/:authorId
export const getPostCount = (authorId) =>
  apiClient.get(`${POSTS_BASE}/count/${authorId}`);

// PUT /api/v1/posts/:postId
export const updatePost = (postId, data) =>
  apiClient.put(`${POSTS_BASE}/${postId}`, data);
// data: { content?, mediaUrls?, visibility? }

// PATCH /api/v1/posts/:postId/visibility?visibility=PUBLIC
export const changeVisibility = (postId, visibility) =>
  apiClient.patch(`${POSTS_BASE}/${postId}/visibility`, null, {
    params: { visibility },
  });

// DELETE /api/v1/posts/:postId
export const deletePost = (postId) =>
  apiClient.delete(`${POSTS_BASE}/${postId}`);