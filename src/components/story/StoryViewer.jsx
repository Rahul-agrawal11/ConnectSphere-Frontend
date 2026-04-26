import React, { useState, useEffect } from 'react';
import { mediaApi } from '../../api/mediaApi';
import { useAuth } from '../../context/AuthContext';

const DURATION = 5000;

export default function StoryViewer({ stories, onClose }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const story = stories[current];
    if (story && user?.userId !== story.authorId) {
      mediaApi.viewStory(story.id).catch(() => {});
    }
  }, [current, stories, user]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (current < stories.length - 1) {
            setCurrent(c => c + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return p + (100 / (DURATION / 100));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [current, stories.length, onClose]);

  const story = stories[current];
  if (!story) return null;

  const secondsLeft = Math.ceil(story.secondsUntilExpiry / 3600);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50
                 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-[600px] bg-black rounded-2xl
                   overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-2 inset-x-2 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 bg-white bg-opacity-30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < current ? '100%'
                       : i === current ? `${progress}%`
                       : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story info */}
        <div className="absolute top-6 inset-x-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-600" />
            <div>
              <p className="text-white text-xs font-medium">
                User #{story.authorId}
              </p>
              <p className="text-white text-opacity-70 text-xs">
                {secondsLeft}h left
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white text-xl hover:text-gray-300 transition"
          >
            ✕
          </button>
        </div>

        {/* Media */}
        {story.mediaType === 'VIDEO' ? (
          <video
            src={story.mediaUrl}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={story.mediaUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-12 inset-x-0 p-4 bg-gradient-to-t from-black to-transparent">
            <p className="text-white text-sm">{story.caption}</p>
          </div>
        )}

        {/* Views */}
        <div className="absolute bottom-4 left-4 text-white text-xs opacity-70">
          👁 {story.viewsCount} views
        </div>

        {/* Navigation */}
        <button
          onClick={() => current > 0 && setCurrent(c => c - 1)}
          className="absolute left-0 top-0 w-1/3 h-full opacity-0 cursor-pointer"
        />
        <button
          onClick={() => {
            if (current < stories.length - 1) setCurrent(c => c + 1);
            else onClose();
          }}
          className="absolute right-0 top-0 w-2/3 h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}