import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../api/mediaApi';
import { followApi } from '../api/followApi';
import { useAuth } from '../context/AuthContext';
import StoryReel from '../components/story/StoryReel';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function Stories() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);

  // Backend: GET /api/v1/follows/internal/following-ids/{userId}
  // Returns raw List<Long> — NOT wrapped in ApiResponse
  // so followingData.data = List<Long> directly
  const { data: followingData } = useQuery({
    queryKey: ['followingIds', user?.userId],
    queryFn: () => followApi.getFollowingIds(user.userId),
    enabled: !!user?.userId,
  });
  // FIX: was followingData?.data (wrong) — the /internal endpoint
  // returns a plain list, so axios res.data IS the list
  const followedUserIds = followingData?.data || [];

  // Backend: GET /api/v1/stories/user/{authorId}
  // Returns ApiResponse<List<StoryResponse>>
  const { data: myStoriesData, isLoading } = useQuery({
    queryKey: ['stories', 'my'],
    queryFn: () => mediaApi.getStoriesByUser(user.userId),
    enabled: !!user?.userId,
  });
  const myStories = myStoriesData?.data?.data || [];

  // Backend: POST /api/v1/stories (multipart/form-data: file, caption?)
  // Returns ApiResponse<StoryResponse>
  const uploadMutation = useMutation({
    mutationFn: () => mediaApi.createStory(file, caption),
    onSuccess: () => {
      toast.success('Story posted!');
      setFile(null);
      setCaption('');
      setPreview(null);
      qc.invalidateQueries({ queryKey: ['stories'] });
    },
    onError: () => toast.error('Upload failed'),
  });

  // Backend: DELETE /api/v1/stories/{storyId}
  const deleteMutation = useMutation({
    mutationFn: (storyId) => mediaApi.deleteStory(storyId),
    onSuccess: () => {
      toast.success('Story deleted');
      qc.invalidateQueries({ queryKey: ['stories'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="page-container page-container--compact">
      <h1 className="page-title">Stories</h1>

      {/* Create Story */}
      <div className="story-upload-card">
        <h3 className="story-upload-card__title">Share a Story</h3>

        {preview && (
          <div className="story-preview">
            {file?.type.startsWith('video') ? (
              <video
                src={preview}
                className="story-preview__media"
              />
            ) : (
              <img
                src={preview}
                alt=""
                className="story-preview__media"
              />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="story-preview__remove"
            >
              ✕
            </button>
          </div>
        )}

        <div className="form-stack">
          <label className="file-input-label">
            <span className="visually-hidden">Choose photo or video</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              onChange={handleFileChange}
              className="file-input"
            />
          </label>

          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption…"
            maxLength={500}
            className="form-input"
          />

          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
            className="primary-button primary-button--full"
          >
            {uploadMutation.isPending ? 'Uploading…' : 'Share Story'}
          </button>
        </div>
      </div>

      {/* Story Reel (from followed users) */}
      <StoryReel followedUserIds={followedUserIds} />

      {/* My Active Stories */}
      {myStories.length > 0 && (
        <div className="my-stories-card">
          <h3 className="my-stories-card__title">Your Active Stories</h3>
          <div className="my-stories-list">
            {isLoading ? <Spinner size="sm" /> : myStories.map(story => (
              <div
                key={story.id}
                className="my-story-item"
              >
                {story.mediaType === 'VIDEO' ? (
                  <video
                    src={story.mediaUrl}
                    className="my-story-item__thumb"
                  />
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt=""
                    className="my-story-item__thumb"
                  />
                )}
                <div className="my-story-item__body">
                  <p className="my-story-item__caption">
                    {story.caption || 'No caption'}
                  </p>
                  <p className="my-story-item__meta">
                    👁 {story.viewsCount} · {Math.ceil((story.secondsUntilExpiry || 0) / 3600)}h left
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(story.id)}
                  disabled={deleteMutation.isPending}
                  className="text-action-button text-action-button--danger"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
