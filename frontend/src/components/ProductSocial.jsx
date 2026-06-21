import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';
import { mediaUrl } from '../utils/mediaUrl';
import AdminBadge from './AdminBadge';

const formatDate = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function ProductSocial({ productId }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/comments/product/${productId}`);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting('comment');
    setError('');
    try {
      const { data } = await api.post(`/comments/product/${productId}`, { text: commentText });
      setComments((prev) => [data, ...prev]);
      setCommentText('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post comment'));
    } finally {
      setSubmitting('');
    }
  };

  const deleteComment = async (id) => {
    if (!confirm('Delete this comment?')) return;
    await api.delete(`/comments/${id}`);
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  if (loading) {
    return <div className="social-section"><div className="loader-page" style={{ minHeight: 120 }}><div className="spinner" /></div></div>;
  }

  return (
    <div className="social-section">
      {/* Comments */}
      <section className="social-block">
        <h2>Comments ({comments.length})</h2>

        {isAuthenticated ? (
          <form className="comment-form" onSubmit={handleComment}>
            <textarea
              className="form-textarea"
              placeholder="Ask a question or leave a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting === 'comment'}>
              {submitting === 'comment' ? <span className="spinner" /> : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p className="social-hint"><Link to="/login">Log in</Link> to comment.</p>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="social-empty">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="comment-card">
                <div className="comment-card-top">
                  <div className="social-author">
                    <span className="user-avatar user-avatar-sm" aria-hidden="true">
                      {c.user.avatarUrl ? (
                        <img src={mediaUrl(c.user.avatarUrl)} alt="" />
                      ) : (
                        <span>{c.user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                      )}
                    </span>
                    <div>
                      <strong>{c.user.name}</strong>
                      {c.user.role === 'admin' && <AdminBadge />}
                    </div>
                  </div>
                  <span className="social-time">{formatDate(c.createdAt)}</span>
                </div>
                <p>{c.text}</p>
                {(String(c.user._id) === String(user?.id) || user?.isAdmin) && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteComment(c._id)}>
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
