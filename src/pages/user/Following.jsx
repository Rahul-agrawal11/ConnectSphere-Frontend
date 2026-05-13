import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { followApi } from '../../api/followApi';
import { authApi } from '../../api/authApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

export default function Following() {
  const { id } = useParams();
  const userId = Number(id);

  const { data, isLoading } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => followApi.getFollowing(userId, 0, 50),
  });
  const follows = data?.data?.data?.content || [];

  return (
    <div className="page-container page-container--compact">
      <h1 className="page-title">Following</h1>
      {isLoading ? (
        <Spinner center />
      ) : follows.length === 0 ? (
        <p className="empty-inline empty-inline--spacious">Not following anyone yet.</p>
      ) : (
        <div className="user-list-card">
          {follows.map(f => (
            <UserRow key={f.id} userId={f.followeeId} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ userId }) {
  const { data } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => authApi.getProfileById(userId),
    staleTime: 1000 * 60 * 5,
  });
  const u = data?.data?.data;
  if (!u) return null;

  return (
    <Link
      to={`/profile/${userId}`}
      className="user-list-item"
    >
      <Avatar src={u.profilePicUrl} name={u.username} size={10} />
      <div>
        <p className="user-list-item__name">{u.fullName || u.username}</p>
        <p className="user-list-item__handle">@{u.username}</p>
      </div>
    </Link>
  );
}
