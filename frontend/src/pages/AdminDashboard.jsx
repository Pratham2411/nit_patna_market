import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { getPrimaryProductImage, resolveProductImageSrc, handleProductImageError } from '../utils/productImage';
import { getApiErrorMessage } from '../utils/apiError';
import AdminAnnouncementsPanel from '../components/admin/AdminAnnouncementsPanel';
import AdminFeedbackPanel from '../components/admin/AdminFeedbackPanel';
import AdminBroadcastPanel from '../components/admin/AdminBroadcastPanel';
import Toast from '../components/ui/Toast';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCore = useCallback(async () => {
    const [s, u, p] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/products'),
    ]);
    setStats(s.data);
    setUsers(u.data);
    setProducts(p.data);
    return s.data;
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const { data } = await api.get('/admin/announcements');
    setAnnouncements(data);
  }, []);

  const loadFeedback = useCallback(async () => {
    const { data } = await api.get('/admin/feedback');
    setFeedbackList(data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadCore(), loadAnnouncements(), loadFeedback()]);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load admin data'), 'error');
    } finally {
      setLoading(false);
    }
  }, [loadCore, loadAnnouncements, loadFeedback]);

  useEffect(() => { load(); }, [load]);

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

  const bumpOpenFeedback = (delta) => {
    setStats((prev) =>
      prev ? { ...prev, openFeedback: Math.max(0, (prev.openFeedback || 0) + delta) } : prev
    );
  };

  if (loading) return <div className="loader-page"><div className="spinner" /></div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'broadcasts', label: 'Broadcasts' },
    { id: 'feedback', label: stats?.openFeedback > 0 ? `Feedback (${stats.openFeedback})` : 'Feedback' },
    { id: 'products', label: 'Products' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <main className="page-content">
      <div className="container admin-dashboard">
        <header className="admin-page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Moderate the marketplace, manage announcements, and review user feedback.
          </p>
        </header>

        <nav className="admin-tabs" aria-label="Admin sections">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`admin-tab ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && stats && (
          <div className="admin-stats-grid">
            {[
              { label: 'Users', value: stats.users, icon: '👥' },
              { label: 'Products', value: stats.products, icon: '📦' },
              { label: 'Open Feedback', value: stats.openFeedback ?? 0, icon: '📩' },
              { label: 'Spam', value: stats.spam, icon: '🚫' },
              { label: 'Banned', value: stats.banned, icon: '⛔' },
              { label: 'Comments', value: stats.comments, icon: '💬' },
            ].map(({ label, value, icon }) => (
              <button
                key={label}
                type="button"
                className="glass-card admin-stat-card admin-stat-card-btn"
                onClick={() => {
                  if (label === 'Open Feedback') setTab('feedback');
                  else if (label === 'Spam') setTab('products');
                }}
              >
                <span className="admin-stat-icon">{icon}</span>
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'announcements' && (
          <AdminAnnouncementsPanel
            announcements={announcements}
            onRefresh={loadAnnouncements}
            onToast={showToast}
          />
        )}

        {tab === 'broadcasts' && (
          <AdminBroadcastPanel />
        )}

        {tab === 'feedback' && (
          <AdminFeedbackPanel
            feedbackList={feedbackList}
            statusFilter={feedbackFilter}
            onStatusFilterChange={setFeedbackFilter}
            onRefresh={loadFeedback}
            onToast={showToast}
            onStatsUpdate={bumpOpenFeedback}
          />
        )}

        {tab === 'products' && (
          <div className="admin-data-table">
            {products.map((p) => (
              <div key={p._id} className="admin-data-row glass-card">
                <img
                  src={resolveProductImageSrc(getPrimaryProductImage(p))}
                  alt=""
                  className="admin-row-img"
                  onError={handleProductImageError}
                />
                <div className="admin-data-main">
                  <strong>{p.title}</strong>
                  <span className="admin-data-meta">₹{p.price} · {p.seller?.name}</span>
                  {p.isSpam && <span className="admin-status-pill inactive">Spam</span>}
                </div>
                <div className="admin-data-actions">
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
          <div className="admin-data-table">
            {users.map((u) => (
              <div key={u.id} className="admin-data-row glass-card">
                <div className="admin-data-main">
                  <strong>{u.name}</strong>
                  <span className="admin-data-meta">{u.email}</span>
                  {u.isAdmin && <span className="badge badge-admin">Admin</span>}
                  {u.isBanned && <span className="admin-status-pill inactive">Banned</span>}
                </div>
                <div className="admin-data-actions">
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

        <Toast message={toast?.msg} type={toast?.type} />
      </div>
    </main>
  );
}
