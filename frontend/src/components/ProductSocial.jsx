import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [error, setError] = useState('');
  const replyInputRef = useRef(null);

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

  const handleComment = async (e, parentId = null) => {
    e.preventDefault();
    const textToSubmit = parentId ? replyText : commentText;
    if (!textToSubmit.trim()) return;
    
    setSubmitting(parentId ? 'reply' : 'comment');
    setError('');
    
    try {
      const payload = { text: textToSubmit };
      if (parentId) payload.replyTo = parentId;

      const { data } = await api.post(`/comments/product/${productId}`, payload);
      setComments((prev) => [data, ...prev]);
      
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setCommentText('');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post comment'));
    } finally {
      setSubmitting('');
    }
  };

  const deleteComment = async (id) => {
    if (!confirm('Delete this comment and any replies?')) return;
    await api.delete(`/comments/${id}`);
    setComments((prev) => prev.filter((c) => c._id !== id && c.replyTo !== id));
  };

  if (loading) {
    return <div className="social-section"><div className="loader-page" style={{ minHeight: 120 }}><div className="spinner" /></div></div>;
  }

  const topLevelComments = comments.filter((c) => !c.replyTo);

  return (
    <div className="social-section">
      <section className="social-block">
        <h2>Comments ({comments.length})</h2>

        {isAuthenticated ? (
          <form className="comment-form" onSubmit={(e) => handleComment(e, null)}>
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
          {topLevelComments.length === 0 ? (
            <p className="social-empty">No comments yet.</p>
          ) : (
            topLevelComments.map((c) => (
              <div key={c._id} className="comment-thread">
                <div className="comment-card">
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
                  
                  <div className="comment-actions">
                    {isAuthenticated && (
                      <button 
                        type="button" 
                        className="btn btn-text btn-sm"
                        onClick={() => {
                          setReplyingTo(replyingTo === c._id ? null : c._id);
                          setReplyText('');
                          setTimeout(() => {
                            if (replyingTo !== c._id && replyInputRef.current) {
                              replyInputRef.current.focus();
                            }
                          }, 50);
                        }}
                      >
                        {replyingTo === c._id ? 'Cancel Reply' : 'Reply'}
                      </button>
                    )}
                    {(String(c.user._id) === String(user?.id) || user?.isAdmin) && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteComment(c._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {replyingTo === c._id && (
                  <form className="comment-form reply-form" onSubmit={(e) => handleComment(e, c._id)}>
                    <textarea
                      ref={replyInputRef}
                      className="form-textarea"
                      placeholder={`Replying to ${c.user.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={1}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting === 'reply'}>
                      {submitting === 'reply' ? <span className="spinner" /> : 'Reply'}
                    </button>
                  </form>
                )}

                {/* Nested Replies */}
                {comments.filter(reply => reply.replyTo === c._id).length > 0 && (
                  <div className="comment-replies">
                    {comments.filter(reply => reply.replyTo === c._id).reverse().map(reply => (
                      <div key={reply._id} className="comment-card reply-card">
                        <div className="comment-card-top">
                          <div className="social-author">
                            <span className="user-avatar user-avatar-sm" aria-hidden="true">
                              {reply.user.avatarUrl ? (
                                <img src={mediaUrl(reply.user.avatarUrl)} alt="" />
                              ) : (
                                <span>{reply.user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                              )}
                            </span>
                            <div>
                              <strong>{reply.user.name}</strong>
                              {reply.user.role === 'admin' && <AdminBadge />}
                            </div>
                          </div>
                          <span className="social-time">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p>{reply.text}</p>
                        
                        {(String(reply.user._id) === String(user?.id) || user?.isAdmin) && (
                          <div className="comment-actions">
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteComment(reply._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
