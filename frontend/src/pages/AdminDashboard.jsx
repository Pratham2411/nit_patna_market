import { useState, useEffect } from 'react';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementExpires, setAnnouncementExpires] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, p, a, f] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/products'),
        api.get('/admin/announcements'),
        api.get('/admin/feedback'),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setProducts(p.data);
      setAnnouncements(a.data);
      setFeedbackList(f.data);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load admin data'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleSpam = async (id, isSpam) => {
    try {
      await api.patch(`/admin/products/${id}/spam`, { isSpam: !isSpam });
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, isSpam: !isSpam } : p)));
      showToast(isSpam ? 'Unmarked spam' : 'Marked as spam');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Action failed'), 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast('Product deleted');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
    }
  };

  const toggleBan = async (id, isBanned) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/ban`, { isBanned: !isBanned });
      setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
      showToast(isBanned ? 'User unbanned' : 'User banned');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Action failed'), 'error');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete user and all their data?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User deleted');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
    }
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      const payload = { message: newAnnouncement.trim(), active: true };
      if (announcementExpires) payload.expiresAt = new Date(announcementExpires).toISOString();
      const { data } = await api.post('/admin/announcements', payload);
      setAnnouncements((prev) => [data, ...prev]);
      setNewAnnouncement('');
      setAnnouncementExpires('');
      showToast('Announcement published');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to publish'), 'error');
    }
  };

  const toggleAnnouncement = async (id, active) => {
    try {
      const { data } = await api.patch(`/admin/announcements/${id}`, { active: !active });
      setAnnouncements((prev) => prev.map((a) => (a._id === id ? data : a)));
      showToast(active ? 'Announcement hidden' : 'Announcement activated');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Action failed'), 'error');
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      showToast('Announcement deleted');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
    }
  };

  const updateFeedbackStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/feedback/${id}`, { status });
      setFeedbackList((prev) => prev.map((f) => (f._id === id ? data : f)));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              openFeedback: status === 'open'
                ? prev.openFeedback
                : Math.max(0, (prev.openFeedback || 0) - 1),
            }
          : prev
      );
      showToast('Feedback updated');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Action failed'), 'error');
    }
  };

  const deleteFeedback = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/admin/feedback/${id}`);
      const item = feedbackList.find((f) => f._id === id);
      setFeedbackList((prev) => prev.filter((f) => f._id !== id));
      if (item?.status === 'open') {
        setStats((prev) =>
          prev ? { ...prev, openFeedback: Math.max(0, (prev.openFeedback || 0) - 1) } : prev
        );
      }
      showToast('Feedback deleted');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
    }
  };

  if (loading) return <div className="loader-page"><div className="spinner" /></div>;

  const tabs = [
    'overview',
    'announcements',
    'feedback',
    'products',
    'users',
  ];

  return (
    <main className="page-content">
      <div className="container admin-dashboard">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage listings, users, site announcements, and feedback.</p>

        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`admin-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'feedback' && stats?.openFeedback > 0
                ? `Feedback (${stats.openFeedback})`
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div className="admin-stats-grid">
            {[
              { label: 'Users', value: stats.users, icon: '👥' },
              { label: 'Products', value: stats.products, icon: '📦' },
              { label: 'Comments', value: stats.comments, icon: '💬' },
              { label: 'Reviews', value: stats.reviews, icon: '⭐' },
              { label: 'Spam', value: stats.spam, icon: '🚫' },
              { label: 'Banned', value: stats.banned, icon: '⛔' },
              { label: 'Open Feedback', value: stats.openFeedback ?? 0, icon: '📩' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card admin-stat-card">
                <span>{icon}</span>
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'announcements' && (
          <div className="admin-section">
            <form className="glass-card admin-announce-form" onSubmit={postAnnouncement}>
              <h3 className="admin-section-title">Post site-wide message</h3>
              <p className="admin-section-hint">
                Shown in the notification bar for all visitors until dismissed or expired.
              </p>
              <div className="form-group">
                <label htmlFor="announcement-msg">Message</label>
                <input
                  id="announcement-msg"
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="e.g. Maintenance tonight 10 PM – 11 PM"
                  maxLength={500}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="announcement-expires">Expires (optional)</label>
                <input
                  id="announcement-expires"
                  type="datetime-local"
                  value={announcementExpires}
                  onChange={(e) => setAnnouncementExpires(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Publish announcement</button>
            </form>

            <div className="admin-table-wrap">
              {announcements.length === 0 ? (
                <p className="admin-empty">No announcements yet.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a._id} className="admin-row glass-card">
                    <div className="admin-row-body">
                      <strong>{a.message}</strong>
                      <span>
                        {a.active ? 'Active' : 'Hidden'}
                        {a.expiresAt && ` · Expires ${new Date(a.expiresAt).toLocaleString()}`}
                        {a.createdBy?.name && ` · by ${a.createdBy.name}`}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleAnnouncement(a._id, a.active)}
                      >
                        {a.active ? 'Hide' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteAnnouncement(a._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'feedback' && (
          <div className="admin-table-wrap">
            {feedbackList.length === 0 ? (
              <p className="admin-empty">No feedback yet.</p>
            ) : (
              feedbackList.map((f) => (
                <div key={f._id} className="admin-row glass-card admin-feedback-row">
                  <div className="admin-row-body">
                    <strong>{f.subject}</strong>
                    <span>
                      {f.user?.name} ({f.user?.email}) ·{' '}
                      {new Date(f.createdAt).toLocaleString()}
                    </span>
                    <p className="admin-feedback-message">{f.message}</p>
                    <span className={`badge badge-feedback-${f.status}`}>{f.status}</span>
                  </div>
                  <div className="admin-row-actions">
                    {f.status === 'open' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateFeedbackStatus(f._id, 'read')}
                      >
                        Mark read
                      </button>
                    )}
                    {f.status !== 'resolved' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => updateFeedbackStatus(f._id, 'resolved')}
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteFeedback(f._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'products' && (
          <div className="admin-table-wrap">
            {products.map((p) => (
              <div key={p._id} className="admin-row glass-card">
                <img src={mediaUrl(p.imageUrl)} alt="" className="admin-row-img" />
                <div className="admin-row-body">
                  <strong>{p.title}</strong>
                  <span>₹{p.price} · {p.seller?.name}</span>
                  {p.isSpam && <span className="badge badge-sold">Spam</span>}
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleSpam(p._id, p.isSpam)}>
                    {p.isSpam ? 'Unspam' : 'Mark Spam'}
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteProduct(p._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-table-wrap">
            {users.map((u) => (
              <div key={u.id} className="admin-row glass-card">
                <div className="admin-row-body">
                  <strong>{u.name}</strong>
                  <span>{u.email}</span>
                  {u.isAdmin && <span className="badge badge-admin">Admin</span>}
                  {u.isBanned && <span className="badge badge-sold">Banned</span>}
                </div>
                <div className="admin-row-actions">
                  {!u.isAdmin && (
                    <>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleBan(u.id, u.isBanned)}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
          </div>
        )}
      </div>
    </main>
  );
}
