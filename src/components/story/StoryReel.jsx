import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '../../api/mediaApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import StoryViewer from './StoryViewer';
import Avatar from '../common/Avatar';
import { Link } from 'react-router-dom';

export default function StoryReel({ followedUserIds = [] }) {
  const { user } = useAuth();
  const [viewingStories, setViewingStories] = useState(null);

  // Own stories
  const { data: myStoriesData } = useQuery({
    queryKey: ['stories', 'my'],
    queryFn: () => mediaApi.getStoriesByUser(user.userId),
    enabled: !!user,
  });
  const myStories = myStoriesData?.data?.data || [];

  // Feed stories
  const { data: feedStoriesData } = useQuery({
    queryKey: ['stories', 'feed', followedUserIds.join(',')],
    queryFn: () => mediaApi.getStoriesFeed(followedUserIds),
    enabled: followedUserIds.length > 0,
  });
  const feedStories = feedStoriesData?.data?.data || [];

  // Group by authorId
  const grouped = {};
  feedStories.forEach(s => {
    if (!grouped[s.authorId]) grouped[s.authorId] = [];
    grouped[s.authorId].push(s);
  });
  const groups = Object.values(grouped);

  if (myStories.length === 0 && groups.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {/* Add Story */}
          <Link
            to="/stories"
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 border-2
                            border-blue-300 flex items-center justify-center
                            text-2xl hover:bg-blue-200 transition cursor-pointer">
              +
            </div>
            <span className="text-xs text-gray-500">Your story</span>
          </Link>

          {/* My stories */}
          {myStories.length > 0 && (
            <StoryAvatar
              stories={myStories}
              label="You"
              profilePicUrl={user?.profilePicUrl}
              name={user?.username}
              onClick={() => setViewingStories(myStories)}
            />
          )}

          {/* Friends' stories */}
          {groups.map(stories => (
            <StoryAvatarByAuthor
              key={stories[0].authorId}
              stories={stories}
              onClick={() => setViewingStories(stories)}
            />
          ))}
        </div>
      </div>

      {viewingStories && (
        <StoryViewer
          stories={viewingStories}
          onClose={() => setViewingStories(null)}
        />
      )}
    </>
  );
}

function StoryAvatar({ stories, label, profilePicUrl, name, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-shrink-0"
    >
      <div className="story-ring w-14 h-14 rounded-full p-0.5">
        <Avatar src={profilePicUrl} name={name} size={14} />
      </div>
      <span className="text-xs text-gray-600 max-w-[56px] truncate">{label}</span>
    </button>
  );
}

function StoryAvatarByAuthor({ stories, onClick }) {
  const { data } = useQuery({
    queryKey: ['profile', stories[0].authorId],
    queryFn: () => authApi.getProfileById(stories[0].authorId),
    staleTime: 1000 * 60 * 5,
  });
  const author = data?.data?.data;

  return (
    <StoryAvatar
      stories={stories}
      label={author?.username || `User #${stories[0].authorId}`}
      profilePicUrl={author?.profilePicUrl}
      name={author?.username}
      onClick={onClick}
    />
  );
}