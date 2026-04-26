import apiClient from './apiClient';

export const followApi = {
  follow: (followeeId) =>
    apiClient.post(`/api/v1/follows/${followeeId}`),

  unfollow: (followeeId) =>
    apiClient.delete(`/api/v1/follows/${followeeId}`),

  isFollowing: (followeeId) =>
    apiClient.get(`/api/v1/follows/is-following/${followeeId}`),

  getFollowers: (userId, page = 0, size = 20) =>
    apiClient.get(
      `/api/v1/follows/${userId}/followers?page=${page}&size=${size}`
    ),

  getFollowing: (userId, page = 0, size = 20) =>
    apiClient.get(
      `/api/v1/follows/${userId}/following?page=${page}&size=${size}`
    ),

  getFollowCounts: (userId) =>
    apiClient.get(`/api/v1/follows/${userId}/counts`),

  getFollowingIds: (userId) =>
    apiClient.get(`/api/v1/follows/internal/following-ids/${userId}`),

  getMutualFollows: (userId) =>
    apiClient.get(`/api/v1/follows/${userId}/mutual`),

  getSuggestions: (limit = 10) =>
    apiClient.get(`/api/v1/follows/suggestions?limit=${limit}`),
};