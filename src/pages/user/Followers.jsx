import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { followApi } from '../../api/followApi';
import { authApi } from '../../api/authApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

export default function Followers() {
    const { id } = useParams();
    const userId = Number(id);

    const { data, isLoading } = useQuery({
        queryKey: ['followers', userId],
        queryFn: () => followApi.getFollowers(userId, 0, 50),
    });
    const follows = data?.data?.data?.content || [];

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-800 mb-4">Followers</h1>
            {isLoading ? (
                <Spinner center />
            ) : follows.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No followers yet.</p>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
                    {follows.map(f => (
                        <UserRow key={f.id} userId={f.followerId} />
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
            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
        >
            <Avatar src={u.profilePicUrl} name={u.username} size={10} />
            <div>
                <p className="font-medium text-gray-900">{u.fullName || u.username}</p>
                <p className="text-sm text-gray-500">@{u.username}</p>
            </div>
        </Link>
    );
}