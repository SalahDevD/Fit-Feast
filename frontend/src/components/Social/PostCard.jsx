import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaBookmark,
  FaCommentDots,
  FaEdit,
  FaHeart,
  FaPaperPlane,
  FaRegBookmark,
  FaShareAlt,
  FaTrash,
} from 'react-icons/fa';

const getUserName = (userDetails) =>
  userDetails?.full_name || userDetails?.username || 'Member';

const getUserInitial = (userDetails) =>
  getUserName(userDetails).charAt(0).toUpperCase() || 'M';

const extractPostTags = (post) => {
  const rawTags = [
    ...(Array.isArray(post?.tags) ? post.tags : []),
    ...(Array.isArray(post?.dish_details?.tags) ? post.dish_details.tags : []),
    ...((post?.content || '').match(/#[\p{L}\p{N}_-]+/gu) || []),
  ];

  return [...new Set(rawTags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 6);
};

const getRelatedCard = (post) => {
  if (post?.dish_details) {
    return {
      title: post.dish_details.name,
      meta: `${post.dish_details.calories || 0} kcal · ${post.dish_details.proteins || 0}g protein`,
    };
  }

  if (post?.custom_dish_details) {
    return {
      title: post.custom_dish_details.title || 'Custom dish',
      meta: `${post.custom_dish_details.calories_kcal || 0} kcal · ${post.custom_dish_details.protein_g || 0}g protein`,
    };
  }

  return null;
};

const PostCard = ({
  commentText = '',
  commentsOpen = false,
  editDraft = '',
  editingImage = null,
  editingImagePreview = '',
  index = 0,
  isEditing = false,
  isOwned = false,
  isSaved = false,
  onCancelEdit,
  onCommentChange,
  onCommentSubmit,
  onDelete,
  onEditDraftChange,
  onEditImageChange,
  onLike,
  onSaveEdit,
  onShare,
  onStartEdit,
  onToggleComments,
  onToggleSave,
  post,
  resolveMediaUrl,
}) => {
  const tags = useMemo(() => extractPostTags(post), [post]);
  const relatedCard = useMemo(() => getRelatedCard(post), [post]);

  return (
    <motion.article
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="ff-panel ff-panel--strong overflow-hidden rounded-[2rem] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {post.user_details?.profile_picture_url ? (
            <img
              src={post.user_details.profile_picture_url}
              alt={getUserName(post.user_details)}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-200/70"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-bold text-slate-950">
              {getUserInitial(post.user_details)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">
              {getUserName(post.user_details)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {post.formatted_time || new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwned ? (
            <>
              <button
                type="button"
                onClick={isEditing ? onCancelEdit : onStartEdit}
                className="ff-icon-button h-11 w-11"
                aria-label={isEditing ? 'Cancel post edit' : 'Edit post'}
              >
                <FaEdit />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="ff-icon-button h-11 w-11 border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/10"
                aria-label="Delete post"
              >
                <FaTrash />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={onToggleSave}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
              isSaved
                ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-amber-400/10 dark:hover:text-amber-200'
            }`}
            aria-label={isSaved ? 'Remove saved post' : 'Save post'}
          >
            {isSaved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editDraft}
              onChange={(event) => onEditDraftChange(event.target.value)}
              className="ff-textarea min-h-[140px]"
              placeholder="Refine your post"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Post image
              </label>
              <label className="flex items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-4 transition cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-400/5 dark:hover:border-emerald-400/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onEditImageChange(event.target.files?.[0] || null)}
                  className="hidden"
                />
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-200" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                  Click to change image (optional)
                </span>
              </label>
              {editingImagePreview && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Preview</p>
                  <img
                    src={editingImagePreview}
                    alt="Image preview"
                    className="h-auto w-full max-h-64 rounded-[1.25rem] object-cover ring-2 ring-emerald-200 dark:ring-emerald-400/20"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onSaveEdit} className="ff-button-primary">
                Save changes
              </button>
              <button type="button" onClick={onCancelEdit} className="ff-button-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
            {post.content || ''}
          </p>
        )}

        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={`${post.id}-${tag}`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        ) : null}

        {post.image ? (
          <img
            src={resolveMediaUrl(post.image)}
            alt="Post"
            className="h-auto w-full rounded-[1.75rem] object-cover"
          />
        ) : null}

        {relatedCard ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="font-semibold text-slate-900 dark:text-white">{relatedCard.title}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{relatedCard.meta}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
        <button
          type="button"
          onClick={onLike}
          className={`flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold transition ${
            post.is_liked_by_user
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200'
              : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200'
          }`}
        >
          <FaHeart />
          {post.likes_count || 0}
        </button>
        <button
          type="button"
          onClick={onToggleComments}
          className="flex items-center justify-center gap-2 rounded-full bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
        >
          <FaCommentDots />
          {post.comments_count || 0}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex items-center justify-center gap-2 rounded-full bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-sky-50 hover:text-sky-600 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-sky-400/10 dark:hover:text-sky-200"
        >
          <FaShareAlt />
          Share
        </button>
        <button
          type="button"
          onClick={onToggleSave}
          className="flex items-center justify-center gap-2 rounded-full bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-amber-600 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-amber-400/10 dark:hover:text-amber-200"
        >
          {isSaved ? <FaBookmark /> : <FaRegBookmark />}
          Save
        </button>
      </div>

      <AnimatePresence initial={false}>
        {commentsOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="space-y-3">
                {post.comments_list?.length ? (
                  post.comments_list.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-white">
                        {getUserInitial(comment.user_details)}
                      </div>
                      <div className="flex-1 rounded-[1.3rem] bg-slate-50 px-4 py-3 dark:bg-white/5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {getUserName(comment.user_details)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {comment.formatted_time || new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {comment.content || comment.body || ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.3rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    No comments yet.
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(event) => onCommentChange(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && onCommentSubmit()}
                  className="ff-input flex-1"
                />
                <button type="button" onClick={onCommentSubmit} className="ff-button-primary px-5">
                  <FaPaperPlane />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
};

export default React.memo(PostCard);
