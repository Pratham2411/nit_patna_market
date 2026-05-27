import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import Toast from '../ui/Toast';

export default function FeedbackSection() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await api.post('/feedback', { subject, message });
      setSubject('');
      setMessage('');
      showToast('Thanks! Your feedback was sent to the admins.', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not send feedback'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="feedback" className="feedback-section" aria-labelledby="feedback-heading">
      <div className="feedback-section-glow" aria-hidden="true" />
      <div className="container feedback-section-inner">
        <div className="feedback-section-header">
          <span className="feedback-eyebrow">We&apos;d love to hear from you</span>
          <h2 id="feedback-heading" className="feedback-title">
            Share your <span className="gradient">feedback</span>
          </h2>
          <p className="feedback-subtitle">
            Report bugs, suggest features, or tell us how we can improve NIT Patna Market.
            Your message goes directly to our admin team.
          </p>
        </div>

        <div className="feedback-card glass-card">
          {!user ? (
            <div className="feedback-guest">
              <p>Sign in to send feedback to the admins.</p>
              <div className="feedback-guest-actions">
                <Link to="/login" className="btn btn-primary">Log in</Link>
                <Link to="/register" className="btn btn-secondary">Create account</Link>
              </div>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={handleSubmit}>
              <div className="feedback-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="feedback-subject">Subject</label>
                  <input
                    id="feedback-subject"
                    className="form-input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's this about?"
                    maxLength={120}
                    required
                  />
                </div>
                <div className="form-group feedback-message-group">
                  <label className="form-label" htmlFor="feedback-message">Your message</label>
                  <textarea
                    id="feedback-message"
                    className="form-input feedback-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your feedback in detail..."
                    rows={5}
                    maxLength={2000}
                    required
                  />
                </div>
              </div>
              <div className="feedback-form-footer">
                <p className="feedback-form-note">
                  Sending as <strong>{user.name}</strong> ({user.email})
                </p>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg feedback-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Sending...
                    </>
                  ) : (
                    'Send feedback'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </section>
  );
}
