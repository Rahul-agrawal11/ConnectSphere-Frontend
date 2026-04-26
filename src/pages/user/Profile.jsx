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
    <p className="text-center text-gray-500 py-12">User not found.</p>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover + Avatar */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl h-36 mb-4" />

      <div className="bg-white rounded-xl border border-gray-200 px-6 pt-0 pb-5 -mt-8 mx-2 shadow-sm">
        <div className="flex items-end justify-between -translate-y-8">
          <Avatar
            src={profile.profilePicUrl}
            name={profile.username}
            size={20}
            className="border-4 border-white shadow-md"
          />

          <div className="flex gap-2 mt-16">
            {isOwnProfile ? (
              <Link
                to="/edit-profile"
                className="px-4 py-2 border border-gray-200 text-sm font-medium
                           rounded-xl hover:bg-gray-50 transition"
              >
                Edit Profile
              </Link>
            ) : isAuthenticated && (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition
                  ${isFollowing
                    ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {followMutation.isPending
                  ? '…'
                  : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="-mt-4">
          <h1 className="text-xl font-bold text-gray-900">
            {profile.fullName || profile.username}
          </h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm text-gray-700 mt-2">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <Link
              to={`/profile/${userId}/followers`}
              className="text-center hover:text-blue-600 transition"
            >
              <p className="font-bold text-gray-900">{counts?.followerCount ?? '–'}</p>
              <p className="text-xs text-gray-500">Followers</p>
            </Link>
            <Link
              to={`/profile/${userId}/following`}
              className="text-center hover:text-blue-600 transition"
            >
              <p className="font-bold text-gray-900">{counts?.followingCount ?? '–'}</p>
              <p className="text-xs text-gray-500">Following</p>
            </Link>
            <div className="text-center">
              <p className="font-bold text-gray-900">{posts.length}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="mt-4 space-y-4">
        <h2 className="font-semibold text-gray-700 px-1">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No posts yet.</p>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}