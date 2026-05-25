import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/my/listings');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyListings(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast('Listing deleted');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'available' ? 'sold' : 'available';
    try {
      const { data } = await api.patch(`/products/${product._id}/status`, { status: newStatus });
      setProducts((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      showToast(`Marked as ${data.status}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const available = products.filter((p) => p.status === 'available');
  const sold      = products.filter((p) => p.status === 'sold');

  return (
    <main className="page-content">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">My Listings</h1>
            <p className="page-subtitle">Manage all items you&apos;re selling, {user?.name?.split(' ')[0]}.</p>
          </div>
          <Link to="/sell" className="btn btn-primary btn-lg">+ Add New Listing</Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: products.length, icon: '📦' },
            { label: 'Active',  value: available.length, icon: '✅' },
            { label: 'Sold',   value: sold.length,      icon: '🔴' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card" style={{ padding: '20px 28px', flex: '1', minWidth: 140, textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-light)' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No listings yet</h3>
            <p style={{ marginBottom: 24 }}>Start by listing something you no longer need.</p>
            <Link to="/sell" className="btn btn-primary">+ Create First Listing</Link>
          </div>
        ) : (
          <div className="dash-grid">
            {products.map((product) => {
              const fallback = `https://picsum.photos/seed/${encodeURIComponent(product.title)}/600/400`;
              return (
                <div key={product._id} className="dash-card">
                  <img
                    className="dash-card-img"
                    src={mediaUrl(product.imageUrl) || fallback}
                    alt={product.title}
                    onError={(e) => { e.target.src = fallback; }}
                  />
                  <div className="dash-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`} style={{ fontSize: '0.68rem' }}>
                        {product.status}
                      </span>
                      <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>{product.category}</span>
                    </div>
                    <div className="dash-card-title" title={product.title}>{product.title}</div>
                    <div className="dash-card-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
                    <div className="dash-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        👁️
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/sell/${product._id}`)}
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn btn-sm ${product.status === 'available' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(product)}
                        title={product.status === 'available' ? 'Mark as Sold' : 'Mark Available'}
                      >
                        {product.status === 'available' ? '🔴' : '✅'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
          </div>
        )}
      </div>
    </main>
  );
}
