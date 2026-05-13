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
    <div className="page-container page-container--narrow">
      <Link
        to="/feed"
        className="back-link"
      >
        ← Back to feed
      </Link>

      <PostCard post={post} />

      {/* Comments Section */}
      <div className="comments-section" id="comments">
        <h3 className="comments-section__title">
          Comments ({post.commentsCount})
        </h3>

        <CommentBox postId={postId} />

        <div className="comments-section__list">
          {commentsLoading ? (
            <Spinner center />
          ) : comments.length === 0 ? (
            <p className="empty-inline">
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
