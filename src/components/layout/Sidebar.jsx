import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Users } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { getTrendingHashtags } from '../../api/searchApi';
import { getSuggestedUsers, follow, unfollow, isFollowing } from '../../api/followApi';
import { getProfileById } from '../../api/authApi';
import { useToast } from '../common/Toast';
import './Sidebar.css';

const extractList = (body) => {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.content)) return body.content;
  if (body.data) return extractList(body.data);
  return [];
};

const Sidebar = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [trending, setTrending] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    loadTrending();
    if (user) loadSuggested();
  }, [user]);

  const loadTrending = async () => {
    try {
      const res = await getTrendingHashtags(8);
      setTrending(extractList(res.data));
    } catch (error) {
      console.error('Failed to load trending hashtags:', error);
      setTrending([]);
    }
  };

  const loadSuggested = async () => {
    try {
      const idsRes = await getSuggestedUsers(5);
      const ids = extractList(idsRes.data);

      const profiles = await Promise.all(
        ids.map((id) =>
          getProfileById(id)
            .then((r) => r.data.data)
            .catch(() => null)
        )
      );

      const valid = profiles.filter(Boolean);
      setSuggested(valid);

      const map = {};
      await Promise.all(
        valid.map(async (u) => {
          try {
            const r = await isFollowing(u.id);
            map[u.id] = r.data.data;
          } catch {
            map[u.id] = false;
          }
        })
      );

      setFollowingMap(map);
    } catch (error) {
      console.error('Failed to load suggested users:', error);
      setSuggested([]);
    }
  };

  const handleFollow = async (targetId) => {
    try {
      if (followingMap[targetId]) {
        await unfollow(targetId);
        setFollowingMap((m) => ({ ...m, [targetId]: false }));
        addToast('Unfollowed', 'info');
      } else {
        await follow(targetId);
        setFollowingMap((m) => ({ ...m, [targetId]: true }));
        addToast('Following!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-section__title">
          <TrendingUp size={15} /> Trending
        </h3>

        {trending.length === 0 ? (
          <p className="sidebar-section__empty">No trends yet</p>
        ) : (
          <ul className="sidebar-hashtag-list">
            {trending.map((h) => (
              <li key={h.id || h.tag}>
                <button
                  type="button"
                  className="sidebar-hashtag"
                  onClick={() => navigate(`/search?tag=${h.tag}`)}
                >
                  <span className="sidebar-hashtag__name">#{h.tag}</span>
                  <span className="sidebar-hashtag__count">
                    {h.postCount ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {user && (
        <div className="sidebar-section">
          <h3 className="sidebar-section__title">
            <Users size={15} /> Who to Follow
          </h3>

          {suggested.length === 0 ? (
            <p className="sidebar-section__empty">No suggestions right now</p>
          ) : (
            <ul className="sidebar-suggest-list">
              {suggested.map((u) => (
                <li key={u.id} className="sidebar-suggest-item">
                  <Link to={`/profile/${u.id}`} className="sidebar-suggest-item__info">
                    <Avatar
                      src={u.profilePicUrl}
                      username={u.username}
                      size={36}
                    />

                    <div className="sidebar-suggest-item__text">
                      <span className="sidebar-suggest-item__name">
                        {u.fullName || u.username}
                      </span>
                      <span className="sidebar-suggest-item__handle">
                        @{u.username}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    className={`btn btn-sm ${
                      followingMap[u.id] ? 'btn-outline' : 'btn-primary'
                    }`}
                    onClick={() => handleFollow(u.id)}
                  >
                    {followingMap[u.id] ? 'Unfollow' : 'Follow'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;