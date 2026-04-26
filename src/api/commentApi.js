import apiClient from './apiClient';

export const commentApi = {
  // Backend DTO: { postId, parentCommentId?, content }
  addComment: (data) =>
    apiClient.post('/api/v1/comments', data),

  getCommentById: (commentId) =>
    apiClient.get(`/api/v1/comments/${commentId}`),

  getCommentsByPost: (postId, page = 0, size = 20) =>
    apiClient.get(`/api/v1/comments/post/${postId}`, { params: { page, size } }),

  getReplies: (parentCommentId, page = 0, size = 10) =>
    apiClient.get(`/api/v1/comments/${parentCommentId}/replies`, {
      params: { page, size },
    }),

  getCommentsByUser: (authorId, page = 0, size = 20) =>
    apiClient.get(`/api/v1/comments/user/${authorId}`, { params: { page, size } }),

  getCommentCount: (postId) =>
    apiClient.get(`/api/v1/comments/post/${postId}/count`),

  getTotalCommentCount: (postId) =>
    apiClient.get(`/api/v1/comments/post/${postId}/count/total`),

  // Backend DTO: { content }
  updateComment: (commentId, data) =>
    apiClient.put(`/api/v1/comments/${commentId}`, data),

  deleteComment: (commentId) =>
    apiClient.delete(`/api/v1/comments/${commentId}`),

  adminDeleteComment: (commentId) =>
    apiClient.delete(`/api/v1/comments/admin/${commentId}`),
};