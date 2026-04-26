import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postApi } from '../../api/postApi';
import { commentApi } from '../../api/commentApi';
import PostCard from '../../components/post/PostCard';
import CommentThread from '../../components/post/CommentThread';
import CommentBox from '../../components/post/CommentBox';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);

  const { data: postData, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postApi.getPostById(postId),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentApi.getCommentsByPost(postId, 0, 50),
    enabled: !!postId,
  });

  const post = postData?.data?.data;
  const comments = commentsData?.data?.data?.content || [];

  if (postLoading) return <Spinner center />;
  if (postError || !post) {
    return <ErrorMessage message="Post not found or has been deleted." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/feed"
        className="inline-flex items-center gap-1 text-sm text-gray-500
                   hover:text-gray-700 mb-4 transition"
      >
        ← Back to feed
      </Link>

      <PostCard post={post} />

      {/* Comments Section */}
      <div className="bg-white rounded-xl border border-gray-200 mt-4 p-4" id="comments">
        <h3 className="font-semibold text-gray-800 mb-4">
          Comments ({post.commentsCount})
        </h3>

        <CommentBox postId={postId} />

        <div className="mt-4 space-y-4">
          {commentsLoading ? (
            <Spinner center />
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map(comment => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={postId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}