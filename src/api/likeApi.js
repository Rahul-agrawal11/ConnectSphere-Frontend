import apiClient from './apiClient';

const LIKES_BASE = '/api/v1/likes';

// ── Core Reactions ───────────────────────────────────────────────────────

/**
 * POST /api/v1/likes
 * React to a post, comment, or story.
 * @param {{ targetId: number, targetType: 'POST'|'COMMENT'|'STORY', reactionType: 'LIKE'|'LOVE'|'HAHA'|'WOW'|'SAD'|'ANGRY' }} data
 */
export const react = (data) =>
  apiClient.post(LIKES_BASE, data);

/**
 * DELETE /api/v1/likes?targetId=...&targetType=...
 * Remove a reaction from a post, comment, or story.
 */
export const unreact = (targetId, targetType) =>
  apiClient.delete(LIKES_BASE, { params: { targetId, targetType } });

/**
 * PUT /api/v1/likes/change?targetId=...&targetType=...&newReactionType=...
 * Change an existing reaction type (e.g. LIKE → LOVE).
 */
export const changeReaction = (targetId, targetType, newReactionType) =>
  apiClient.put(`${LIKES_BASE}/change`, null, {
    params: { targetId, targetType, newReactionType },
  });

// ── Queries ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/likes/has-reacted?targetId=...&targetType=...
 */
export const hasReacted = (targetId, targetType) =>
  apiClient.get(`${LIKES_BASE}/has-reacted`, { params: { targetId, targetType } });

/**
 * GET /api/v1/likes/my-reaction?targetId=...&targetType=...
 *
 * FIX: Backend now returns 200 with data=null when user has not reacted
 * (previously returned 404). This function no longer needs special error
 * handling — a null in res.data.data simply means "no reaction yet".
 *
 * Usage:
 *   const res = await getMyReaction(targetId, targetType);
 *   const reactionType = res.data.data?.reactionType || null;
 */
export const getMyReaction = (targetId, targetType) =>
  apiClient.get(`${LIKES_BASE}/my-reaction`, { params: { targetId, targetType } });

/**
 * GET /api/v1/likes/summary?targetId=...&targetType=...
 * Returns { targetId, targetType, totalCount, reactions: { LIKE: 3, LOVE: 1, ... } }
 */
export const getReactionSummary = (targetId, targetType) =>
  apiClient.get(`${LIKES_BASE}/summary`, { params: { targetId, targetType } });

/**
 * GET /api/v1/likes/count?targetId=...&targetType=...
 */
export const getReactionCount = (targetId, targetType) =>
  apiClient.get(`${LIKES_BASE}/count`, { params: { targetId, targetType } });

// ── Story Reaction Helpers ───────────────────────────────────────────────

/**
 * React to a story.
 * Convenience wrapper — sets targetType = 'STORY' automatically.
 * @param {number} storyId
 * @param {'LIKE'|'LOVE'|'HAHA'|'WOW'|'SAD'|'ANGRY'} reactionType
 */
export const reactToStory = (storyId, reactionType) =>
  react({ targetId: storyId, targetType: 'STORY', reactionType });

/**
 * Remove a reaction from a story.
 * @param {number} storyId
 */
export const unreactFromStory = (storyId) =>
  unreact(storyId, 'STORY');

/**
 * Get the current user's reaction on a story.
 * @param {number} storyId
 */
export const getMyStoryReaction = (storyId) =>
  getMyReaction(storyId, 'STORY');

/**
 * Get reaction summary for a story.
 * @param {number} storyId
 */
export const getStoryReactionSummary = (storyId) =>
  getReactionSummary(storyId, 'STORY');