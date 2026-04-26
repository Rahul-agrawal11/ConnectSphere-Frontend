import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followApi } from '../../api/followApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

export default function Suggestions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => followApi.getSuggestions(20),
  });
  const userIds = data?.data?.data || [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">
        People you might know
      </h1>

      {isLoading ? (
        <Spinner center />
      ) : userIds.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No suggestions right now"
          subtitle="Follow more people to get personalized suggestions"
          action={
            <Link
              to="/search?type=users"
              className="px-5 py-2 bg-blue-600 text-white rounded-xl
                         hover:bg-blue-700 transition text-sm font-medium"
            >
              Search Users
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
          {userIds.map(uid => (
            <SuggestionCard key={uid} userId={uid} />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ userId }) {
  const qc = useQueryClient();
  const [followed, setFollowed] = React.useState(false);

  const { data } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => authApi.getProfileById(userId),
    staleTime: 1000 * 60 * 5,
  });
  const profile = data?.data?.data;

  const mutation = useMutation({
    mutationFn: () => followApi.follow(userId),
    onSuccess: () => {
      setFollowed(true);
      toast.success(`Following ${profile?.username}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Follow failed'),
  });

  if (!profile) return null;

  return (
    <div className="flex items-center gap-3 p-4">
      <Link to={`/profile/${userId}`}>
        <Avatar src={profile.profilePicUrl} name={profile.username} size={10} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${userId}`}
          className="font-medium text-gray-900 hover:text-blue-600 transition block truncate"
        >
          {profile.fullName || profile.username}
        </Link>
        <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
      </div>
      {!followed ? (
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-xl
                     hover:bg-blue-700 transition font-medium
                     disabled:opacity-50 flex-shrink-0"
        >
          Follow
        </button>
      ) : (
        <span className="px-4 py-1.5 border border-gray-200 text-gray-500
                         text-sm rounded-xl flex-shrink-0">
          Following ✓
        </span>
      )}
    </div>
  );
}