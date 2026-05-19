import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminModal } from '../../components/Admin/AdminModal';
import { adminAPI } from '../../api/axios';
import toast from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';

/**
 * Admin Posts Moderation - View and delete community posts
 */
export const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const pageSize = 20;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, search: searchQuery };
      const res = await adminAPI.listPosts(params);
      setPosts(res.data.results || res.data);
      setTotal(res.data.count || res.data.length || 0);
    } catch (error) {
      toast.error('Erreur lors du chargement des posts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchComments = async (post) => {
    setSelectedPost(post);
    setCommentsLoading(true);
    try {
      const res = await adminAPI.getPostComments(post.id);
      setComments(res.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des commentaires');
      console.error(error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Supprimer ce post ?')) {
      try {
        await adminAPI.deletePost(postId);
        toast.success('Post supprime');
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
          setComments([]);
        }
        fetchPosts();
      } catch (error) {
        toast.error('Erreur lors de la suppression du post');
        console.error(error);
      }
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (window.confirm('Supprimer ce commentaire ?')) {
      try {
        const res = await adminAPI.deletePostComment(postId, commentId);
        toast.success(res.data?.message || 'Commentaire supprime');
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments_count: Math.max(0, (post.comments_count || 0) - 1),
                }
              : post
          )
        );
      } catch (error) {
        toast.error('Erreur lors de la suppression du commentaire');
        console.error(error);
      }
    }
  };

  const truncateText = (text, length = 90) =>
    !text ? '-' : text.length > length ? `${text.substring(0, length)}...` : text;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout title="Moderation Posts" subtitle="Review community content, inspect comment threads, and keep the feed clean.">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par auteur ou contenu..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="ff-input"
        />
      </div>

      <div className="ff-table-shell overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">Aucun post</div>
        ) : (
          <>
            <table className="ff-table w-full">
              <thead>
                <tr>
                  <th>Auteur</th>
                  <th>Email</th>
                  <th>Contenu</th>
                  <th>Visibilite</th>
                  <th>Likes</th>
                  <th>Commentaires</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.author_name || '-'}</td>
                    <td>{post.user_email || '-'}</td>
                    <td>{truncateText(post.text)}</td>
                    <td>{post.visibility || '-'}</td>
                    <td>{post.likes_count ?? 0}</td>
                    <td>
                      <button
                        onClick={() => fetchComments(post)}
                        className="font-semibold text-emerald-600 underline-offset-4 transition hover:text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        {post.comments_count ?? 0}
                      </button>
                    </td>
                    <td>
                      {post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchComments(post)}
                          className="ff-button-secondary px-3 py-2 text-sm"
                        >
                          Commentaires
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
                          title="Supprimer le post"
                          aria-label="Supprimer le post"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {Math.min(page, totalPages)} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="ff-button-secondary px-4 py-2 text-sm disabled:opacity-50"
                >
                  Precedent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="ff-button-secondary px-4 py-2 text-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AdminModal
        isOpen={!!selectedPost}
        onClose={() => {
          setSelectedPost(null);
          setComments([]);
        }}
        title={selectedPost ? `Commentaires du post #${selectedPost.id}` : 'Commentaires'}
      >
        {commentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Aucun commentaire</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {comment.author_name || '-'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {comment.user_email || '-'} - {comment.created_at ? new Date(comment.created_at).toLocaleString('fr-FR') : '-'}
                  </p>
                  <p className="mt-2 break-words text-slate-700 dark:text-slate-300">{comment.body}</p>
                </div>
                <button
                  onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                  className="ff-button-secondary shrink-0 border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </AdminLayout>
  );
};
