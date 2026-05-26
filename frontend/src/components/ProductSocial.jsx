import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';
import { mediaUrl } from '../utils/mediaUrl';
import StarRating from './StarRating';
import AdminBadge from './AdminBadge';

const formatDate = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function ProductSocial({ productId }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [commentText, setCommentText] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        api.get(`/comments/product/${productId}`),
        api.get(`/reviews/product/${productId}`),
      ]);
      setComments(cRes.data);
      setReviews(rRes.data.reviews);
      setSummary(rRes.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const myReview = reviews.find((r) => String(r.user._id) === String(user?.id));

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

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting('review');
    setError('');
    try {
      const { data } = await api.post(`/reviews/product/${productId}`, reviewForm);
      setReviews((prev) => [data, ...prev]);
      setSummary((s) => ({
        totalReviews: s.totalReviews + 1,
        averageRating: Math.round(((s.averageRating * s.totalReviews + data.rating) / (s.totalReviews + 1)) * 10) / 10,
      }));
      setReviewForm({ rating: 5, text: '' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setSubmitting('');
    }
  };

  const deleteComment = async (id) => {
    if (!confirm('Delete this comment?')) return;
    await api.delete(`/comments/${id}`);
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/reviews/${id}`);
    await load();
  };

  if (loading) {
    return <div className="social-section"><div className="loader-page" style={{ minHeight: 120 }}><div className="spinner" /></div></div>;
  }

  return (
    <div className="social-section">
      {/* Reviews */}
      <section className="social-block">
        <div className="social-block-header">
          <h2>Reviews &amp; Ratings</h2>
          <div className="rating-summary">
            <StarRating value={Math.round(summary.averageRating)} readOnly />
            <span className="rating-summary-text">
              <strong>{summary.averageRating || '0'}</strong> · {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {isAuthenticated && !myReview && (
          <form className="review-form glass-card" onSubmit={handleReview}>
            <p className="form-label">Your rating</p>
            <StarRating value={reviewForm.rating} onChange={(rating) => setReviewForm((f) => ({ ...f, rating }))} />
            <textarea
              className="form-textarea"
              placeholder="Share your experience with this listing (optional)"
              value={reviewForm.text}
              onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
              rows={3}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting === 'review'}>
              {submitting === 'review' ? <span className="spinner" /> : 'Submit Review'}
            </button>
          </form>
        )}

        {myReview && (
          <p className="social-hint">You reviewed this listing. One review per user.</p>
        )}

        {!isAuthenticated && (
          <p className="social-hint"><Link to="/login">Log in</Link> to leave a review.</p>
        )}

        <div className="review-list">
          {reviews.length === 0 ? (
            <p className="social-empty">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="review-card glass-card">
                <div className="review-card-top">
                  <div className="social-author">
                    <span className="user-avatar user-avatar-sm" aria-hidden="true">
                      {r.user.avatarUrl ? (
                        <img src={mediaUrl(r.user.avatarUrl)} alt="" />
                      ) : (
                        <span>{r.user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                      )}
                    </span>
                    <div>
                      <strong>{r.user.name}</strong>
                      {r.user.role === 'admin' && <AdminBadge />}
                    </div>
                    <StarRating value={r.rating} readOnly size="sm" />
                  </div>
                  <span className="social-time">{formatDate(r.createdAt)}</span>
                </div>
                {r.text && <p className="review-text">{r.text}</p>}
                {(String(r.user._id) === String(user?.id) || user?.isAdmin) && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteReview(r._id)}>
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

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
