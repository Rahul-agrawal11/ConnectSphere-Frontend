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
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Stories</h1>

      {/* Create Story */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-3">Share a Story</h3>

        {preview && (
          <div className="mb-3 relative">
            {file?.type.startsWith('video') ? (
              <video
                src={preview}
                className="w-full max-h-48 rounded-xl object-cover"
              />
            ) : (
              <img
                src={preview}
                alt=""
                className="w-full max-h-48 rounded-xl object-cover"
              />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white
                         rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="sr-only">Choose photo or video</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3
                         file:py-2 file:px-4 file:rounded-lg file:border-0
                         file:text-sm file:font-medium file:bg-blue-50
                         file:text-blue-700 hover:file:bg-blue-100 transition"
            />
          </label>

          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption…"
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />

          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm
                       font-medium hover:bg-blue-700 transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? 'Uploading…' : 'Share Story'}
          </button>
        </div>
      </div>

      {/* Story Reel (from followed users) */}
      <StoryReel followedUserIds={followedUserIds} />

      {/* My Active Stories */}
      {myStories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-4">
          <h3 className="font-medium text-gray-700 mb-3">Your Active Stories</h3>
          <div className="space-y-2">
            {isLoading ? <Spinner size="sm" /> : myStories.map(story => (
              <div
                key={story.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                {story.mediaType === 'VIDEO' ? (
                  <video
                    src={story.mediaUrl}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    {story.caption || 'No caption'}
                  </p>
                  <p className="text-xs text-gray-400">
                    👁 {story.viewsCount} · {Math.ceil((story.secondsUntilExpiry || 0) / 3600)}h left
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(story.id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-red-400 hover:text-red-600 transition px-2
                             disabled:opacity-50"
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