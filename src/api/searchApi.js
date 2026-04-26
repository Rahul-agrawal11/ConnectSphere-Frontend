import apiClient from './apiClient';

export const searchApi = {
  searchPosts: (keyword, page = 0, size = 10) =>
    apiClient.get(
      `/api/v1/search/posts?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
    ),

  searchUsers: (query) =>
    apiClient.get(`/api/v1/search/users?query=${encodeURIComponent(query)}`),

  searchHashtags: (query, limit = 10) =>
    apiClient.get(
      `/api/v1/search/hashtags?query=${encodeURIComponent(query)}&limit=${limit}`
    ),

  getTrending: (limit = 10) =>
    apiClient.get(`/api/v1/hashtags/trending?limit=${limit}`),

  getHashtag: (tag) =>
    apiClient.get(`/api/v1/hashtags/${tag}`),

  getHashtagsForPost: (postId) =>
    apiClient.get(`/api/v1/hashtags/post/${postId}`),

  getPostsByHashtag: (tag, page = 0, size = 10) =>
    apiClient.get(
      `/api/v1/hashtags/${tag}/posts?page=${page}&size=${size}`
    ),

  indexPost: (postId, content) =>
    apiClient.post(
      `/api/v1/hashtags/index?postId=${postId}&content=${encodeURIComponent(content)}`
    ),

  removePostIndex: (postId) =>
    apiClient.delete(`/api/v1/hashtags/index/${postId}`),
};