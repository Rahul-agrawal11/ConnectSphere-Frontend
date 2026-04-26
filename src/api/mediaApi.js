import apiClient from './apiClient';

export const mediaApi = {
  uploadMedia: (file, linkedPostId = null) => {
    const form = new FormData();
    form.append('file', file);
    if (linkedPostId) form.append('linkedPostId', linkedPostId);
    return apiClient.post('/api/v1/media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMediaByPost: (postId) =>
    apiClient.get(`/api/v1/media/post/${postId}`),

  getMediaById: (mediaId) =>
    apiClient.get(`/api/v1/media/${mediaId}`),

  deleteMedia: (mediaId) =>
    apiClient.delete(`/api/v1/media/${mediaId}`),

  createStory: (file, caption = '') => {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    return apiClient.post('/api/v1/stories', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getStoriesByUser: (authorId) =>
    apiClient.get(`/api/v1/stories/user/${authorId}`),

  getStoriesFeed: (followedUserIds) => {
    const ids = followedUserIds.join(',');
    return apiClient.get(`/api/v1/stories/feed?followedUserIds=${ids}`);
  },

  viewStory: (storyId) =>
    apiClient.post(`/api/v1/stories/${storyId}/view`),

  deleteStory: (storyId) =>
    apiClient.delete(`/api/v1/stories/${storyId}`),
};