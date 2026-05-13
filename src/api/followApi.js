import apiClient from './apiClient';

const FOLLOWS_BASE = '/api/v1/follows';

// POST /api/v1/follows/:followeeId
export const follow = (followeeId) =>
  apiClient.post(`${FOLLOWS_BASE}/${followeeId}`);

// DELETE /api/v1/follows/:followeeId
export const unfollow = (followeeId) =>
  apiClient.delete(`${FOLLOWS_BASE}/${followeeId}`);

// GET /api/v1/follows/is-following/:followeeId
export const isFollowing = (followeeId) =>
  apiClient.get(`${FOLLOWS_BASE}/is-following/${followeeId}`);

// GET /api/v1/follows/:userId/followers?page=0&size=20
export const getFollowers = (userId, page = 0, size = 20) =>
  apiClient.get(`${FOLLOWS_BASE}/${userId}/followers`, { params: { page, size } });

// GET /api/v1/follows/:userId/following?page=0&size=20
export const getFollowing = (userId, page = 0, size = 20) =>
  apiClient.get(`${FOLLOWS_BASE}/${userId}/following`, { params: { page, size } });

// GET /api/v1/follows/:userId/counts
export const getFollowCounts = (userId) =>
  apiClient.get(`${FOLLOWS_BASE}/${userId}/counts`);

// GET /api/v1/follows/:userId/mutual
export const getMutualFollowIds = (userId) =>
  apiClient.get(`${FOLLOWS_BASE}/${userId}/mutual`);

// GET /api/v1/follows/suggestions?limit=10
export const getSuggestedUsers = (limit = 10) =>
  apiClient.get(`${FOLLOWS_BASE}/suggestions`, { params: { limit } });

// GET /api/v1/follows/internal/following-ids/:userId
export const getFollowingIds = (userId) =>
  apiClient.get(`${FOLLOWS_BASE}/internal/following-ids/${userId}`);