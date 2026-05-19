import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaBookmark,
  FaHeart,
  FaImage,
  FaPaperPlane,
  FaPlus,
  FaRegClock,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import FileUploadField from '../../components/Common/FileUploadField';
import EmptyState from '../../components/Common/EmptyState';
import PostCard from '../../components/Social/PostCard';
import { APP_BASE_URL, extractApiErrorMessage, socialAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const SAVED_POSTS_KEY = 'fitfeast-social-saved-posts';
const INITIAL_BATCH_SIZE = 6;
const COMMUNITY_PREVIEW_COUNT = 4;

const collectionConfig = {
  my: {
    label: 'My posts',
    description: 'Everything you have published to the Fit Feast community.',
    emptyTitle: 'No posts published yet',
    emptyDescription: 'Share a meal, a progress win, or a quick note to start your feed.',
    icon: FaPaperPlane,
  },
  saved: {
    label: 'Saved posts',
    description: 'The posts you bookmarked to revisit later.',
    emptyTitle: 'No saved posts yet',
    emptyDescription: 'Save recipes, wins, and ideas from the community to build your inspiration library.',
    icon: FaBookmark,
  },
  liked: {
    label: 'Liked posts',
    description: 'Community posts you reacted to most recently.',
    emptyTitle: 'No liked posts yet',
    emptyDescription: 'Like posts you enjoy and they will appear here instantly.',
    icon: FaHeart,
  },
};

const resolveMediaUrl = (path) => {
  if (!path) {
    return '';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${APP_BASE_URL}${path.startsWith('/') ? path : `/media/${path}`}`;
};

const normalizePosts = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

const SocialSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="ff-panel ff-panel--strong animate-pulse rounded-[2rem] p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
        <div className="mt-5 h-4 w-full rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-4 w-4/5 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="mt-5 h-56 rounded-[1.6rem] bg-slate-200 dark:bg-white/10" />
      </div>
    ))}
  </div>
);

const SocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [activeCollection, setActiveCollection] = useState('my');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingImage, setEditingImage] = useState(null);
  const [editingImagePreview, setEditingImagePreview] = useState('');
  const [savedPostIds, setSavedPostIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_POSTS_KEY) || '[]');
    } catch (_error) {
      return [];
    }
  });
  const loadMoreRef = useRef(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    if (!newPostImage) {
      setPreviewUrl('');
      return undefined;
    }

    const nextUrl = URL.createObjectURL(newPostImage);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [newPostImage]);

  const savedPosts = useMemo(
    () => posts.filter((post) => savedPostIds.includes(post.id)),
    [posts, savedPostIds]
  );
  const likedPosts = useMemo(
    () => posts.filter((post) => post.is_liked_by_user),
    [posts]
  );

  const activityTabs = useMemo(
    () => [
      { id: 'my', label: 'My posts', value: myPosts.length },
      { id: 'saved', label: 'Saved posts', value: savedPosts.length },
      { id: 'liked', label: 'Liked posts', value: likedPosts.length },
    ],
    [likedPosts.length, myPosts.length, savedPosts.length]
  );

  const collectionPosts = useMemo(
    () => ({
      my: myPosts,
      saved: savedPosts,
      liked: likedPosts,
    }),
    [likedPosts, myPosts, savedPosts]
  );

  const activePosts = useMemo(
    () => collectionPosts[activeCollection] || [],
    [activeCollection, collectionPosts]
  );
  const communityPosts = useMemo(() => posts, [posts]);
  const visibleCommunityPosts = useMemo(
    () => communityPosts.slice(0, COMMUNITY_PREVIEW_COUNT),
    [communityPosts]
  );
  const visiblePosts = useMemo(
    () => activePosts.slice(0, visibleCount),
    [activePosts, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_BATCH_SIZE, activePosts.length || INITIAL_BATCH_SIZE));
  }, [activeCollection, activePosts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + INITIAL_BATCH_SIZE, activePosts.length));
        }
      },
      { threshold: 0.2 }
    );

    if (loadMoreRef.current && visibleCount < activePosts.length) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [activePosts.length, visibleCount]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const [feedResponse, myPostsResponse] = await Promise.all([
        socialAPI.getFeed(),
        socialAPI.getMyPosts(),
      ]);

      const feedPosts = normalizePosts(feedResponse.data);
      const ownPosts = normalizePosts(myPostsResponse.data);

      setPosts(feedPosts);
      setMyPosts(ownPosts);
    } catch (error) {
      console.error('Social feed loading error', error);
      setPosts([]);
      setMyPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePostCollections = (updater) => {
    setPosts((current) => updater(current));
    setMyPosts((current) => updater(current));
  };

  const replacePostInCollections = (nextPost) => {
    updatePostCollections((collection) =>
      collection.map((post) => (post.id === nextPost.id ? nextPost : post))
    );
  };

  const removePostFromCollections = (postId) => {
    updatePostCollections((collection) => collection.filter((post) => post.id !== postId));
    setSavedPostIds((current) => current.filter((id) => id !== postId));
    setCommentText((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setShowComments((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast.error('Write something before publishing.');
      return;
    }

    const formData = new FormData();
    formData.append('content', newPost.trim());
    if (newPostImage) {
      formData.append('image', newPostImage);
    }

    setPublishing(true);
    try {
      const response = await socialAPI.createPost(formData);
      const nextPost = response.data;
      setPosts((current) => [nextPost, ...current]);
      setMyPosts((current) => [nextPost, ...current]);
      setNewPost('');
      setNewPostImage(null);
      setActiveCollection('my');
      setVisibleCount(INITIAL_BATCH_SIZE);
      toast.success('Post published.');
    } catch (error) {
      console.error('Create post error', extractApiErrorMessage(error?.response?.data || error));
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId) => {
    const previousPosts = posts;
    const previousMyPosts = myPosts;

    const toggleLikeState = (collection) =>
      collection.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked_by_user: !post.is_liked_by_user,
              likes_count: Math.max(
                Number(post.likes_count || 0) + (post.is_liked_by_user ? -1 : 1),
                0
              ),
            }
          : post
      );

    setPosts(toggleLikeState);
    setMyPosts(toggleLikeState);

    try {
      await socialAPI.likePost(postId);
    } catch (error) {
      setPosts(previousPosts);
      setMyPosts(previousMyPosts);
      console.error('Like error', extractApiErrorMessage(error?.response?.data || error));
    }
  };

  const handleComment = async (postId) => {
    const content = commentText[postId];
    if (!content?.trim()) {
      return;
    }

    try {
      const response = await socialAPI.commentPost(postId, content.trim());
      const nextComment = response.data;

      updatePostCollections((collection) =>
        collection.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: Number(post.comments_count || 0) + 1,
                comments_list: [nextComment, ...(post.comments_list || [])],
              }
            : post
        )
      );

      setCommentText((current) => ({ ...current, [postId]: '' }));
      setShowComments((current) => ({ ...current, [postId]: true }));
      toast.success('Comment added.');
    } catch (error) {
      console.error('Comment error', extractApiErrorMessage(error?.response?.data || error));
    }
  };

  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/social#post-${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Fit Feast post',
          text: 'Check out this Fit Feast community post.',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
      toast.success('Post link shared.');
    } catch (_error) {
      toast.error('The post link could not be shared.');
    }
  };

  const toggleSavePost = (postId) => {
    setSavedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [postId, ...current]
    );
  };

  const handleStartEdit = (post) => {
    setEditingPostId(post.id);
    setEditingContent(post.content || '');
    setEditingImage(null);
    setEditingImagePreview(post.image ? resolveMediaUrl(post.image) : '');
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingContent('');
    setEditingImage(null);
    setEditingImagePreview('');
  };

  const handleSaveEdit = async () => {
    if (!editingPostId) {
      return;
    }

    if (!editingContent.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', editingContent.trim());
      if (editingImage) {
        formData.append('image', editingImage);
      }

      const response = await socialAPI.updatePost(editingPostId, formData);
      replacePostInCollections(response.data);
      toast.success('Post updated.');
      handleCancelEdit();
    } catch (error) {
      console.error('Update post error', extractApiErrorMessage(error?.response?.data || error));
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await socialAPI.deletePost(postId);
      removePostFromCollections(postId);
      if (editingPostId === postId) {
        handleCancelEdit();
      }
      toast.success('Post deleted.');
    } catch (error) {
      console.error('Delete post error', extractApiErrorMessage(error?.response?.data || error));
    }
  };

  const authorName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'You';

  if (loading) {
    return (
      <div className="ff-page">
        <div className="ff-page__inner max-w-6xl">
          <SocialSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <div className="ff-page__inner grid max-w-7xl gap-8 xl:grid-cols-[0.92fr,1.5fr]">
        <div className="space-y-6">
          <section className="ff-panel--dark overflow-hidden rounded-[2.5rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Community profile
            </p>
            <div className="mt-5 flex items-center gap-4">
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={authorName}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-300/50"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-xl font-bold text-slate-950">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-white">{authorName}</h1>
                <p className="truncate text-sm text-slate-300">{user?.email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {activityTabs.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveCollection(item.id)}
                  className={`rounded-[1.6rem] border p-4 text-left transition ${
                    activeCollection === item.id
                      ? 'border-emerald-300/40 bg-white/16 shadow-[0_20px_55px_-42px_rgba(16,185,129,0.72)]'
                      : 'border-white/10 bg-white/8 hover:border-white/20 hover:bg-white/12'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-300">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        activeCollection === item.id
                          ? 'bg-emerald-400/15 text-emerald-100'
                          : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      Live tab
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
                  Your latest activity
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  {collectionConfig[activeCollection].label}
                </h2>
              </div>
              <div className="ff-tab-group">
                {activityTabs.map((item) => (
                  <button
                    key={`feed-${item.id}`}
                    type="button"
                    onClick={() => setActiveCollection(item.id)}
                    role="tab"
                    aria-selected={activeCollection === item.id}
                    className="ff-tab-pill"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {item.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {visiblePosts.length ? (
              visiblePosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  isSaved={savedPostIds.includes(post.id)}
                  isOwned={post.user === user?.id}
                  isEditing={editingPostId === post.id}
                  editDraft={editingPostId === post.id ? editingContent : post.content || ''}
                  commentsOpen={Boolean(showComments[post.id])}
                  commentText={commentText[post.id] || ''}
                  onLike={() => handleLike(post.id)}
                  onToggleSave={() => toggleSavePost(post.id)}
                  onShare={() => handleShare(post.id)}
                  onToggleComments={() =>
                    setShowComments((current) => ({
                      ...current,
                      [post.id]: !current[post.id],
                    }))
                  }
                  onCommentChange={(value) =>
                    setCommentText((current) => ({
                      ...current,
                      [post.id]: value,
                    }))
                  }
                  onCommentSubmit={() => handleComment(post.id)}
                  onStartEdit={() => handleStartEdit(post)}
                  onCancelEdit={handleCancelEdit}
                  onEditDraftChange={setEditingContent}
                  editingImage={editingImage}
                  editingImagePreview={editingImagePreview}
                  onEditImageChange={(file) => {
                    setEditingImage(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditingImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  onSaveEdit={handleSaveEdit}
                  onDelete={() => handleDeletePost(post.id)}
                  resolveMediaUrl={resolveMediaUrl}
                />
              ))
            ) : (
              <EmptyState
                icon={collectionConfig[activeCollection].icon}
                title={collectionConfig[activeCollection].emptyTitle}
                description={collectionConfig[activeCollection].emptyDescription}
              />
            )}

            {visibleCount < activePosts.length ? (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-6 text-sm text-slate-500 dark:text-slate-400"
              >
                Loading more posts...
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="ff-panel ff-panel--strong rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  Create a post
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  Share a meal, progress update, or thought
                </h2>
              </div>
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                onClick={handleCreatePost}
                disabled={publishing}
                className={`ff-button-primary h-12 w-12 shrink-0 rounded-full p-0 ${
                  publishing ? 'cursor-not-allowed opacity-70' : ''
                }`}
                aria-label="Publish post"
              >
                {publishing ? <FaPlus className="animate-spin" /> : <FaPaperPlane />}
              </motion.button>
            </div>

            <div className="mt-5 flex gap-4">
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={authorName}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-200/80"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 font-bold text-slate-950">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <textarea
                  placeholder="What are you enjoying today?"
                  value={newPost}
                  onChange={(event) => setNewPost(event.target.value)}
                  className="ff-textarea min-h-[150px]"
                />

                <div className="mt-4">
                  <FileUploadField
                    id="social-post-image"
                    name="social_post_image"
                    label=""
                    accept="image/*"
                    value={newPostImage}
                    previewUrl={previewUrl}
                    onChange={(event) => setNewPostImage(event.target.files?.[0] || null)}
                    description="Add a meal photo, progress snapshot, or story image."
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <FaImage />
                    Image ready
                    <span className="text-slate-400 dark:text-slate-500">
                      {newPostImage ? newPostImage.name : 'Optional'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={publishing}
                    className={`ff-button-primary ${publishing ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <FaPaperPlane />
                    {publishing ? 'Publishing...' : 'Publish now'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
                  Community feed
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  See what everyone is sharing
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Latest posts from the wider Fit Feast community, including other members.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {communityPosts.length} community post{communityPosts.length === 1 ? '' : 's'}
              </span>
            </div>

            {visibleCommunityPosts.length ? (
              visibleCommunityPosts.map((post, index) => (
                <PostCard
                  key={`community-${post.id}`}
                  post={post}
                  index={index}
                  isSaved={savedPostIds.includes(post.id)}
                  isOwned={post.user === user?.id}
                  isEditing={editingPostId === post.id}
                  editDraft={editingPostId === post.id ? editingContent : post.content || ''}
                  commentsOpen={Boolean(showComments[post.id])}
                  commentText={commentText[post.id] || ''}
                  onLike={() => handleLike(post.id)}
                  onToggleSave={() => toggleSavePost(post.id)}
                  onShare={() => handleShare(post.id)}
                  onToggleComments={() =>
                    setShowComments((current) => ({
                      ...current,
                      [post.id]: !current[post.id],
                    }))
                  }
                  onCommentChange={(value) =>
                    setCommentText((current) => ({
                      ...current,
                      [post.id]: value,
                    }))
                  }
                  onCommentSubmit={() => handleComment(post.id)}
                  onStartEdit={() => handleStartEdit(post)}
                  onCancelEdit={handleCancelEdit}
                  onEditDraftChange={setEditingContent}
                  editingImage={editingImage}
                  editingImagePreview={editingImagePreview}
                  onEditImageChange={(file) => {
                    setEditingImage(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditingImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  onSaveEdit={handleSaveEdit}
                  onDelete={() => handleDeletePost(post.id)}
                  resolveMediaUrl={resolveMediaUrl}
                />
              ))
            ) : (
              <EmptyState
                icon={FaPaperPlane}
                title="No community posts yet"
                description="As soon as other members share updates, meals, or wins, they will appear here."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;
