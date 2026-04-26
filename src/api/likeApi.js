import apiClient from './apiClient';

export const likeApi = {
  react: (data) =>
    apiClient.post('/api/v1/likes', data),

  unreact: (targetId, targetType) =>
    apiClient.delete(`/api/v1/likes?targetId=${targetId}&targetType=${targetType}`),

  changeReaction: (targetId, targetType, newReactionType) =>
    apiClient.put(
      `/api/v1/likes/change?targetId=${targetId}&targetType=${targetType}&newReactionType=${newReactionType}`
    ),

  hasReacted: (targetId, targetType) =>
    apiClient.get(
      `/api/v1/likes/has-reacted?targetId=${targetId}&targetType=${targetType}`
    ),

  getUserReaction: (targetId, targetType) =>
    apiClient.get(
      `/api/v1/likes/my-reaction?targetId=${targetId}&targetType=${targetType}`
    ),

  getReactionsByTarget: (targetId, targetType, page = 0, size = 20) =>
    apiClient.get(
      `/api/v1/likes/target?targetId=${targetId}&targetType=${targetType}&page=${page}&size=${size}`
    ),

  getReactionCount: (targetId, targetType) =>
    apiClient.get(
      `/api/v1/likes/count?targetId=${targetId}&targetType=${targetType}`
    ),

  getReactionSummary: (targetId, targetType) =>
    apiClient.get(
      `/api/v1/likes/summary?targetId=${targetId}&targetType=${targetType}`
    ),
};