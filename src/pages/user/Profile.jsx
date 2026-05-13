import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { postApi } from '../../api/postApi';
import { followApi } from '../../api/followApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import PostCard from '../../components/post/PostCard';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const userId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const isOwnProfile = user?.userId === userId;

  // Profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => authApi.getProfileById(userId),
  });
  const profile = profileData?.data?.data;

  // Follow counts
  const { data: countsData } = useQuery({
    queryKey: ['followCounts', userId],
    queryFn: () => followApi.getFollowCounts(userId),
  });
  const counts = countsData?.data?.data;

  // Posts
  const { data: postsData } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => postApi.getPostsByUser(userId, 0, 12),
  });
  const posts = postsData?.data?.data?.content || [];

  // Is following
  const { data: isFollowingData, refetch: refetchFollowing } = useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => followApi.isFollowing(userId),
    enabled: isAuthenticated && !isOwnProfile,
  });
  const isFollowing = isFollowingData?.data?.data;

  // Follow / Unfollow
  const followMutation = useMutation({
    mutationFn: () => isFollowing
      ? followApi.unfollow(userId)
      : followApi.follow(userId),
    onSuccess: () => {
      refetchFollowing();
      qc.invalidateQueries({ queryKey: ['followCounts', userId] });
      toast.success(isFollowing ? 'Unfollowed' : 'Following!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  if (profileLoading) return <Spinner center />;
  if (!profile) return (
    <p className="empty-inline empty-inline--spacious">User not found.</p>
  );

  return (
    <div className="profile-page">
      {/* Cover + Avatar */}
      <div className="profile-cover" />

      <div className="profile-card">
        <div className="profile-card__header">
          <Avatar
            src={profile.profilePicUrl}
            name={profile.username}
            size={20}
            className="profile-card__avatar"
          />

          <div className="profile-card__actions">
            {isOwnProfile ? (
              <Link
                to="/edit-profile"
                className="secondary-button"
              >
                Edit Profile
              </Link>
            ) : isAuthenticated && (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`profile-follow-button ${isFollowing ? 'profile-follow-button--following' : ''}`.trim()}
              >
                {followMutation.isPending
                  ? '…'
                  : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="profile-info">
          <h1 className="profile-name">
            {profile.fullName || profile.username}
          </h1>
          <p className="profile-username">@{profile.username}</p>
          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="profile-stats">
            <Link
              to={`/profile/${userId}/followers`}
              className="profile-stat"
            >
              <p className="profile-stat__count">{counts?.followerCount ?? '–'}</p>
              <p className="profile-stat__label">Followers</p>
            </Link>
            <Link
              to={`/profile/${userId}/following`}
              className="profile-stat"
            >
              <p className="profile-stat__count">{counts?.followingCount ?? '–'}</p>
              <p className="profile-stat__label">Following</p>
            </Link>
            <div className="profile-stat">
              <p className="profile-stat__count">{posts.length}</p>
              <p className="profile-stat__label">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="profile-posts">
        <h2 className="profile-posts__title">Posts</h2>
        {posts.length === 0 ? (
          <p className="empty-inline">No posts yet.</p>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
