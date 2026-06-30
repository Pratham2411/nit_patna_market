import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';
import { Mail, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export default function AdminBroadcastPanel({ onToast }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [failDetails, setFailDetails] = useState(null);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/admin/broadcasts');
      setBroadcasts(res.data);
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Failed to load broadcasts'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      return onToast('Subject and Message are required', 'error');
    }

    if (!window.confirm('Are you sure you want to send this email to ALL active users?')) {
      return;
    }

    setSending(true);
    setFailDetails(null);

    try {
      const res = await api.post('/admin/broadcasts', formData);
      const newBroadcast = res.data;
      setBroadcasts([newBroadcast, ...broadcasts]);
      setFormData({ subject: '', message: '' });
      
      if (newBroadcast.failedCount > 0) {
        onToast(`Broadcast sent, but ${newBroadcast.failedCount} failed.`);
        setFailDetails({
          success: newBroadcast.successCount,
          failed: newBroadcast.failedCount,
          total: newBroadcast.successCount + newBroadcast.failedCount,
          failures: newBroadcast.failures,
        });
      } else {
        onToast('Broadcast sent successfully to all users!');
      }
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Failed to send broadcast'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-grid">
        {/* Compose Section */}
        <div className="admin-form-card glass-card">
          <h3 className="admin-panel-card-title flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Compose Broadcast
          </h3>
          <p className="admin-panel-card-desc">
            Send an email to all active users on the platform
          </p>

          <form onSubmit={handleSubmit} className="admin-announce-form">
            {failDetails && (
              <div style={{ marginBottom: '16px', padding: '16px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: '#f97316' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#9a3412' }}>
                      Partial Delivery Issue ({failDetails.success}/{failDetails.total} successful)
                    </h4>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#c2410c' }}>
                      Some users did not receive the email. See details below.
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #ffedd5', borderRadius: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '12px', color: '#334155' }}>
                        {failDetails.failures.map((f, i) => (
                          <li key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                            <span style={{ fontWeight: '500', color: '#1e293b' }}>{f.email}</span>
                            <span style={{ color: '#ea580c' }}>{f.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Important update about Campus Market"
                maxLength={120}
                required
              />
              <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {formData.subject.length}/120
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-input"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                placeholder="Write your email body here... (Plain text, HTML will be escaped)"
                required
              />
            </div>

            <div className="admin-form-actions" style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !formData.subject.trim() || !formData.message.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {sending ? 'Sending...' : (
                  <>
                    <Mail className="w-4 h-4" /> Send Broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* History Section */}
        <div className="admin-list-card">
          <div className="admin-list-header">
            <h3 className="admin-panel-card-title flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" style={{ marginRight: '8px', verticalAlign: 'middle', color: '#16a34a' }} />
              Broadcast History
            </h3>
            <span className="admin-list-count">{broadcasts.length} sent</span>
          </div>
          
          {loading ? (
            <p className="admin-empty-state">Loading history...</p>
          ) : broadcasts.length === 0 ? (
            <p className="admin-empty-state">No broadcast emails sent yet.</p>
          ) : (
            <div className="admin-data-table">
              {broadcasts.map((b) => (
                <div key={b._id} className="admin-data-row glass-card">
                  <div className="admin-data-main">
                    <div className="admin-data-title-row">
                      <strong>{b.subject}</strong>
                      <span className="admin-status-pill active" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        {b.successCount} Sent
                      </span>
                      {b.failedCount > 0 && (
                        <span className="admin-status-pill inactive" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          {b.failedCount} Failed
                        </span>
                      )}
                    </div>
                    <p className="admin-data-message" style={{ margin: '8px 0', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.message}
                    </p>
                    <span className="admin-data-meta">
                      {new Date(b.createdAt).toLocaleString()}
                      {b.sentBy?.name && ` · Sent by ${b.sentBy.name}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
