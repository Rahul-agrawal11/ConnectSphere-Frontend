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
    <div className="page-container page-container--narrow">
      <h1 className="page-title">
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
              className="primary-button"
            >
              Search Users
            </Link>
          }
        />
      ) : (
        <div className="user-list-card">
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
    <div className="suggestion-card">
      <Link to={`/profile/${userId}`}>
        <Avatar src={profile.profilePicUrl} name={profile.username} size={10} />
      </Link>
      <div className="suggestion-card__info">
        <Link
          to={`/profile/${userId}`}
          className="suggestion-card__name"
        >
          {profile.fullName || profile.username}
        </Link>
        <p className="suggestion-card__handle">@{profile.username}</p>
      </div>
      {!followed ? (
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="primary-button primary-button--sm suggestion-card__action"
        >
          Follow
        </button>
      ) : (
        <span className="following-badge">
          Following ✓
        </span>
      )}
    </div>
  );
}
