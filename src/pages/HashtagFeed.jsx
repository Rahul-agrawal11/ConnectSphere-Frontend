import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import { postApi } from '../api/postApi';
import PostCard from '../components/post/PostCard';
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
        <div className="page-container page-container--narrow">
            {/* Header */}
            <div className="hashtag-header-card">
                <h1 className="hashtag-header-card__title">#{tag}</h1>
                {hashtag && (
                    <p className="hashtag-header-card__meta">
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
                <div className="content-list">
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
            <div className="skeleton-card">
                <div className="skeleton-line skeleton-line--short" />
                <div className="skeleton-line" />
            </div>
        );
    }

    const post = data?.data?.data;
    if (!post) return null;
    return <PostCard post={post} />;
}
