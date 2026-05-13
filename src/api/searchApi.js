import apiClient from './apiClient';

export const searchUsers = (query) =>
  apiClient.get('/api/v1/search/users', { params: { query } });

export const searchUsersDirectly = (query) =>
  apiClient.get('/api/v1/auth/search', { params: { query } });

export const searchPosts = (keyword, page = 0, size = 10) =>
  apiClient.get('/api/v1/posts/search', { params: { keyword, page, size } });

export const searchHashtags = (query, limit = 10) =>
  apiClient.get('/api/v1/search/hashtags', { params: { query, limit } });

export const getTrendingHashtags = (limit = 10) =>
  apiClient.get('/api/v1/hashtags/trending', { params: { limit } });

export const getPostsByHashtag = (tag, page = 0, size = 10) =>
  apiClient.get(`/api/v1/hashtags/${tag}/posts`, { params: { page, size } });

export const getHashtag = (tag) =>
  apiClient.get(`/api/v1/hashtags/${tag}`);

export const getPostById = (postId) =>
  apiClient.get(`/api/v1/posts/${postId}`);