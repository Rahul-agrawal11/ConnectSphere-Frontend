import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, UserCheck, UserPlus, UserMinus, Grid, List } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/post/PostCard';
import Spinner from '../components/common/Spinner';
import { getProfileById } from '../api/authApi';
import { getPostsByUser } from '../api/postApi';
import { getFollowCounts, follow, unfollow, isFollowing } from '../api/followApi';
import { useToast } from '../components/common/Toast';
import './Profile.css';

const Profile = () => {
  const { userId }   = useParams();
  const { user }     = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();
  const targetId     = Number(userId);

  const [profile, setProfile]       = useState(null);
  const [posts, setPosts]           = useState([]);
  const [counts, setCounts]         = useState({ followerCount: 0, followingCount: 0 });
  const [following, setFollowingState] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts]     = useState(true);
  const [followLoading, setFollowLoading]   = useState(false);
  const [page, setPage]             = useState(0);
  const [hasMore, setHasMore]       = useState(false);

  const isOwn = user && user.id === targetId;

  useEffect(() => {
    if (!targetId) return;
    loadProfile();
    loadPosts(0, true);
    loadCounts();
    if (user && !isOwn) checkFollowing();
  }, [targetId, user]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await getProfileById(targetId);
      setProfile(res.data.data);
    } catch {
      addToast('User not found', 'error');
      navigate('/');
    }
    setLoadingProfile(false);
  };

  const loadPosts = async (pageNum = 0, reset = false) => {
    setLoadingPosts(pageNum === 0);
    try {
      const res  = await getPostsByUser(targetId, pageNum, 9);
      const data = res.data.data;
      const list = data?.content || [];
      setPosts((prev) => reset ? list : [...prev, ...list]);
      setHasMore(!data?.last);
      setPage(pageNum);
    } catch {}
    setLoadingPosts(false);
  };

  const loadCounts = async () => {
    try {
      const res = await getFollowCounts(targetId);
      setCounts(res.data.data || {});
    } catch {}
  };

  const checkFollowing = async () => {
    try {
      const res = await isFollowing(targetId);
      setFollowingState(res.data.data);
    } catch {}
  };

  const handleFollow = async () => {
    if (!user) { addToast('Please log in to follow', 'info'); return; }
    setFollowLoading(true);
    try {
      if (following) {
        await unfollow(targetId);
        setFollowingState(false);
        setCounts((c) => ({ ...c, followerCount: Math.max((c.followerCount || 1) - 1, 0) }));
        addToast('Unfollowed', 'info');
      } else {
        await follow(targetId);
        setFollowingState(true);
        setCounts((c) => ({ ...c, followerCount: (c.followerCount || 0) + 1 }));
        addToast('Following!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    }
    setFollowLoading(false);
  };

  if (loadingProfile) {
    return (
      <div className="profile-loading">
        <Spinner size={40} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-page animate-fade-in">
      {/* Cover + Avatar */}
      <div className="profile-cover card">
        <div className="profile-cover__bg" />
        <div className="profile-cover__content">
          <Avatar
            src={profile.profilePicUrl}
            username={profile.username}
            size={96}
            className="profile-cover__avatar"
          />
          <div className="profile-cover__info">
            <h1 className="profile-cover__name">
              {profile.fullName || profile.username}
            </h1>
            <span className="profile-cover__handle">@{profile.username}</span>
            {profile.bio && (
              <p className="profile-cover__bio">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat__value">{posts.length || 0}</span>
                <span className="profile-stat__label">Posts</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat__value">{counts.followerCount || 0}</span>
                <span className="profile-stat__label">Followers</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat__value">{counts.followingCount || 0}</span>
                <span className="profile-stat__label">Following</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="profile-cover__actions">
            {isOwn ? (
              <Link to="/profile/edit" className="btn btn-outline">
                <Settings size={16} /> Edit Profile
              </Link>
            ) : user ? (
              <button
                className={`btn ${following ? 'btn-outline' : 'btn-primary'}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Spinner size={16} />
                ) : following ? (
                  <><UserMinus size={16} /> Unfollow</>
                ) : (
                  <><UserPlus size={16} /> Follow</>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="profile-posts-section">
        <h3 className="profile-posts-section__title">Posts</h3>
        {loadingPosts ? (
          <div className="profile-loading"><Spinner size={32} /></div>
        ) : posts.length === 0 ? (
          <div className="profile-empty">
            <span>📭</span>
            <p>{isOwn ? "You haven't posted yet" : "No posts yet"}</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                onUpdated={(updated) =>
                  setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
              />
            ))}
            {hasMore && (
              <button
                className="btn btn-outline btn-full"
                onClick={() => loadPosts(page + 1)}
              >
                Load more posts
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;