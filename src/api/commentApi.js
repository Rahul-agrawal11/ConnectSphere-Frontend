import apiClient from './apiClient';

const COMMENTS_BASE = '/api/v1/comments';

// POST /api/v1/comments
export const addComment = (data) =>
  apiClient.post(COMMENTS_BASE, data);
// data: { postId, content, parentCommentId? }

// GET /api/v1/comments/:commentId
export const getCommentById = (commentId) =>
  apiClient.get(`${COMMENTS_BASE}/${commentId}`);

// GET /api/v1/comments/post/:postId?page=0&size=10
export const getCommentsByPost = (postId, page = 0, size = 10) =>
  apiClient.get(`${COMMENTS_BASE}/post/${postId}`, { params: { page, size } });

// GET /api/v1/comments/:parentCommentId/replies?page=0&size=10
export const getReplies = (parentCommentId, page = 0, size = 5) =>
  apiClient.get(`${COMMENTS_BASE}/${parentCommentId}/replies`, {
    params: { page, size },
  });

// GET /api/v1/comments/user/:authorId?page=0&size=10
export const getCommentsByUser = (authorId, page = 0, size = 10) =>
  apiClient.get(`${COMMENTS_BASE}/user/${authorId}`, { params: { page, size } });

// GET /api/v1/comments/post/:postId/count
export const getCommentCount = (postId) =>
  apiClient.get(`${COMMENTS_BASE}/post/${postId}/count`);

// PUT /api/v1/comments/:commentId
export const updateComment = (commentId, data) =>
  apiClient.put(`${COMMENTS_BASE}/${commentId}`, data);
// data: { content }

// DELETE /api/v1/comments/:commentId
export const deleteComment = (commentId) =>
  apiClient.delete(`${COMMENTS_BASE}/${commentId}`);