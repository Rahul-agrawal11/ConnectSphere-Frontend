import apiClient from './apiClient';

const MEDIA_BASE = '/api/v1/media';
const STORY_BASE = '/api/v1/stories';

// ── Media ─────────────────────────────────────────────────────────────────

export const uploadMedia = (file, linkedPostId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (linkedPostId) formData.append('linkedPostId', linkedPostId);
  return apiClient.post(MEDIA_BASE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMediaById  = (mediaId) => apiClient.get(`${MEDIA_BASE}/${mediaId}`);
export const getMediaByPost = (postId)  => apiClient.get(`${MEDIA_BASE}/post/${postId}`);
export const deleteMedia    = (mediaId) => apiClient.delete(`${MEDIA_BASE}/${mediaId}`);

// ── Stories ───────────────────────────────────────────────────────────────

export const createStory = (file, caption = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);
  return apiClient.post(STORY_BASE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getStoryById     = (storyId)   => apiClient.get(`${STORY_BASE}/${storyId}`);
export const getStoriesByUser = (authorId)  => apiClient.get(`${STORY_BASE}/user/${authorId}`);
export const deleteStory      = (storyId)   => apiClient.delete(`${STORY_BASE}/${storyId}`);

export const getStoriesFeed = (followedUserIds) =>
  apiClient.get(`${STORY_BASE}/feed`, {
    params: { followedUserIds: followedUserIds.join(',') },
  });

export const viewStory = (storyId) =>
  apiClient.post(`${STORY_BASE}/${storyId}/view`);

/**
 * GET /api/v1/stories/{storyId}/viewers
 * Returns { storyId, totalViewers, viewers: [{ viewerId, viewedAt }] }
 * Only works when called by the story's author.
 */
export const getStoryViewers = (storyId) =>
  apiClient.get(`${STORY_BASE}/${storyId}/viewers`);