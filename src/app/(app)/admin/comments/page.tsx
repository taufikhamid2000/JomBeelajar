'use client';
import { logger } from '@/lib/logger';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Filter, Trash2, RefreshCw, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CareerCommentService } from '@/services/careerCommentService';
import { PathwayCommentService } from '@/services/pathwayCommentService';

type CommentSource = 'pathway' | 'career';
type CommentType = {
  id: string;
  comment: string;
  authorName: string;
  createdAt: string;
  source: CommentSource;
  sourceId: string;
  userId?: string;
  isAnonymous: boolean;
};

export default function CommentsAdminPage() {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CommentSource | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bumped by the retry button to re-run the load effect below.
  const [reloadKey, setReloadKey] = useState(0);

  const reloadComments = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  // Load comments on initial render (and on retry)
  useEffect(() => {
    const loadComments = async () => {
      try {
        // Load pathway comments
        const pathwayComments = await PathwayCommentService.getAllComments();
        const transformedPathwayComments = pathwayComments.map((comment) => ({
          id: comment.id,
          comment: comment.comment,
          authorName: comment.authorName,
          createdAt: comment.createdAt,
          source: 'pathway' as CommentSource,
          sourceId: comment.pathwayId,
          userId: comment.userId,
          isAnonymous: comment.isAnonymous,
        }));

        // Load career comments
        const careerComments = await CareerCommentService.getAllComments();
        const transformedCareerComments = careerComments.map((comment) => ({
          id: comment.id,
          comment: comment.comment,
          authorName: comment.authorName,
          createdAt: comment.createdAt,
          source: 'career' as CommentSource,
          sourceId: comment.careerId,
          userId: comment.userId,
          isAnonymous: comment.isAnonymous,
        }));

        // Combine and sort by date (newest first)
        const allComments = [
          ...transformedPathwayComments,
          ...transformedCareerComments,
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setComments(allComments);
      } catch (err) {
        logger.error('Failed to load comments:', err);
        setError('Failed to load comments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadComments();
  }, [reloadKey]);

  // Filter comments
  const filteredComments = comments.filter((comment) => {
    // Filter by type if not "all"
    if (filter !== 'all' && comment.source !== filter) {
      return false;
    }

    // Filter by search query if any
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        comment.comment.toLowerCase().includes(query) ||
        comment.authorName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle comment deletion
  const handleDeleteComment = async (comment: CommentType) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      let success = false;

      if (comment.source === 'pathway') {
        success = await PathwayCommentService.deleteComment(comment.id);
      } else {
        success = await CareerCommentService.deleteComment(comment.id);
      }

      if (success) {
        // Remove from UI
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
      } else {
        setError('Failed to delete comment. Please try again.');
      }
    } catch (err) {
      logger.error('Error deleting comment:', err);
      setError('An error occurred while deleting the comment.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white dark:text-gray-900">
          <MessageSquare className="inline-block mr-2" size={24} />
          Comments Management
        </h1>

        <button
          onClick={reloadComments}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <RefreshCw className="mr-2" size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800/30 dark:bg-gray-100/30 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex items-center">
            <Filter className="mr-2 text-gray-400" size={18} />
            <span className="text-gray-300 dark:text-gray-700 mr-3">
              Filter by:
            </span>
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as CommentSource | 'all')
              }
              className="bg-gray-700 dark:bg-white text-white dark:text-gray-900 rounded-md px-3 py-2"
            >
              <option value="all">All Comments</option>
              <option value="pathway">Education Pathway</option>
              <option value="career">Career Guidance</option>
            </select>
          </div>

          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search comments or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-gray-700 dark:bg-white text-white dark:text-gray-900 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <p className="text-sm text-gray-400 dark:text-gray-500">
          Showing {filteredComments.length} of {comments.length} total comments
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">
            No comments found matching your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-800/70 dark:bg-white/70 rounded-lg p-5 border-l-4 border-indigo-500 dark:border-indigo-600"
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-white dark:text-gray-900">
                        {comment.authorName}
                        {comment.isAnonymous && (
                          <span className="ml-2 text-xs text-yellow-500">
                            (Anonymous)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <span className="mr-2">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-700/50 dark:bg-gray-200/50 text-xs">
                          {comment.source === 'pathway'
                            ? 'Education Pathway'
                            : 'Career Guidance'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ID: {comment.sourceId}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment)}
                      className="text-red-500 hover:text-red-400 focus:outline-none"
                      title="Delete comment"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-gray-300 dark:text-gray-600 mt-2">
                    {comment.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
