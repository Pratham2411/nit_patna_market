import { useState } from 'react';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function FeedbackModal({ open, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setSubject('');
    setMessage('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/feedback', { subject, message });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(handleClose, 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="modal-card glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="feedback-title"
      >
        <div className="modal-header">
          <h2 id="feedback-title">Send Feedback</h2>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {success ? (
          <p className="feedback-success">Thank you! Your feedback was sent to the admins.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="modal-hint">
              Share bugs, ideas, or concerns. Admins will see your message in the dashboard.
            </p>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label htmlFor="feedback-subject">Subject</label>
              <input
                id="feedback-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary"
                maxLength={120}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="feedback-message">Message</label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more..."
                rows={5}
                maxLength={2000}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send to Admins'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
