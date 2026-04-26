import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import { postApi } from '../api/postApi';
import PostCard from '../components/post/PostCard';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function HashtagFeed() {
    const { tag } = useParams();

    const { data: hashtagData } = useQuery({
        queryKey: ['hashtag', tag],
        queryFn: () => searchApi.getHashtag(tag),
    });

    const { data: postIdsData } = useQuery({
        queryKey: ['hashtagPostIds', tag],
        queryFn: () => searchApi.getPostsByHashtag(tag, 0, 20),
    });

    const hashtag = hashtagData?.data?.data;
    const postIds = postIdsData?.data?.data?.content || [];

    // Fetch each post
    // const postQueries = postIds.map(pid => ({
    //     queryKey: ['post', pid],
    //     queryFn: () => postApi.getPostById(pid),
    // }));

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
                <h1 className="text-2xl font-bold text-blue-600">#{tag}</h1>
                {hashtag && (
                    <p className="text-sm text-gray-500 mt-1">
                        {hashtag.postCount} posts
                    </p>
                )}
            </div>

            {postIds.length === 0 ? (
                <EmptyState
                    icon="#️⃣"
                    title="No posts for this hashtag"
                    subtitle={`Be the first to post with #${tag}`}
                />
            ) : (
                <div className="space-y-4">
                    {postIds.map(postId => (
                        <PostById key={postId} postId={postId} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PostById({ postId }) {
    const { data, isLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: () => postApi.getPostById(postId),
        staleTime: 1000 * 60,
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-24">
                <div className="skeleton h-4 w-1/3 mb-2 rounded" />
                <div className="skeleton h-3 w-full rounded" />
            </div>
        );
    }

    const post = data?.data?.data;
    if (!post) return null;
    return <PostCard post={post} />;
}