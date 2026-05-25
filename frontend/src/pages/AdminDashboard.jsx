import { useState, useEffect } from 'react';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/products'),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setProducts(p.data);
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

  if (loading) return <div className="loader-page"><div className="spinner" /></div>;

  return (
    <main className="page-content">
      <div className="container admin-dashboard">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage NIT Patna Market listings, users, and moderation.</p>

        <div className="admin-tabs">
          {['overview', 'products', 'users'].map((t) => (
            <button
              key={t}
              type="button"
              className={`admin-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
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
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card admin-stat-card">
                <span>{icon}</span>
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
              </div>
            ))}
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
