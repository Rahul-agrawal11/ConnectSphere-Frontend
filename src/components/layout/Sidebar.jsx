import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../../api/searchApi';
import Spinner from '../common/Spinner';

export default function Sidebar() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => searchApi.getTrending(15),
    staleTime: 1000 * 60 * 5,
  });

  const hashtags = data?.data?.data || [];

  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-4">
        {/* Trending Hashtags */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">
            🔥 Trending
          </h3>
          {isLoading ? (
            <Spinner size="sm" />
          ) : hashtags.length === 0 ? (
            <p className="text-xs text-gray-400">No trending tags yet</p>
          ) : (
            <ul className="space-y-2">
              {hashtags.map(tag => (
                <li key={tag.id}>
                  <Link
                    to={`/hashtags/${tag.tag}`}
                    className="flex items-center justify-between
                               hover:bg-gray-50 rounded-lg px-2 py-1 transition"
                  >
                    <span className="text-sm text-blue-600 font-medium">
                      #{tag.tag}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100
                                     px-2 py-0.5 rounded-full">
                      {tag.postCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Quick Links</h3>
          <ul className="space-y-1">
            {[
              { to: '/suggestions', label: '👥 Suggestions' },
              { to: '/stories', label: '📸 Stories' },
              { to: '/search', label: '🔍 Search' },
            ].map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block text-sm text-gray-600 hover:text-blue-600
                             hover:bg-gray-50 rounded-lg px-2 py-1.5 transition"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}