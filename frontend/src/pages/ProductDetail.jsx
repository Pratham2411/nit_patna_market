import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import ProductSocial from '../components/ProductSocial';
import AdminBadge from '../components/AdminBadge';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const isSeller = user && product && String(user.id) === String(product.seller?._id);
  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const handleDelete = async () => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setActionLoading('delete');
    try {
      await api.delete(`/products/${id}`);
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = product.status === 'available' ? 'sold' : 'available';
    setActionLoading('status');
    try {
      const { data } = await api.patch(`/products/${id}/status`, { status: newStatus });
      setProduct(data);
      showToast(`Marked as ${data.status}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const fallback = product
    ? `https://picsum.photos/seed/${encodeURIComponent(product.title)}/800/600`
    : '';

  if (loading) return <div className="loader-page"><div className="spinner" /></div>;
  if (!product) return null;

  return (
    <main className="page-content">
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: 32, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Browse</Link>
          <span> / </span>
          <span style={{ color: 'var(--accent-light)' }}>{product.title}</span>
        </div>

        <div className="detail-grid">
          {/* Image */}
          <div className="detail-image-wrap">
            <img
              src={mediaUrl(product.imageUrl) || fallback}
              alt={product.title}
              onError={(e) => { e.target.src = fallback; }}
            />
          </div>

          {/* Info */}
          <div className="detail-info">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
                {product.status === 'available' ? '✅ Available' : '🔴 Sold'}
              </span>
              <span className="badge badge-gray">{product.category}</span>
            </div>

            <h1 className="detail-title">{product.title}</h1>
            <div className="detail-price">₹{Number(product.price).toLocaleString('en-IN')}</div>

            <p className="detail-description">{product.description}</p>

            <div className="detail-meta-row">
              <div className="detail-meta-item">
                <span>👤</span>
                <span>Seller: <strong>{product.seller?.name}</strong></span>
                {product.seller?.role === 'admin' && <AdminBadge />}
              </div>
              {product.seller?.email && (
                <div className="detail-meta-item">
                  <span>📧</span>
                  <a href={`mailto:${product.seller.email}`} style={{ color: 'var(--accent-light)' }}>
                    {product.seller.email}
                  </a>
                </div>
              )}
              <div className="detail-meta-item">
                <span>📅</span>
                <span>Listed: <strong>{new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              </div>
            </div>

            <div className="detail-actions">
              {isAdmin && !isSeller && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                >
                  {actionLoading === 'delete' ? <span className="spinner" /> : '🗑️ Admin Delete'}
                </button>
              )}
              {isSeller ? (
                <>
                  <Link to={`/sell/${product._id}`} className="btn btn-secondary">✏️ Edit</Link>
                  <button
                    id="toggle-status-btn"
                    className={`btn ${product.status === 'available' ? 'btn-danger' : 'btn-success'}`}
                    onClick={handleToggleStatus}
                    disabled={actionLoading === 'status'}
                  >
                    {actionLoading === 'status'
                      ? <span className="spinner" />
                      : product.status === 'available' ? '🔴 Mark as Sold' : '✅ Mark Available'
                    }
                  </button>
                  <button
                    id="delete-btn"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={actionLoading === 'delete'}
                  >
                    {actionLoading === 'delete' ? <span className="spinner" /> : '🗑️ Delete'}
                  </button>
                </>
              ) : (
                product.status === 'available' && user && (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate(`/messages?product=${product._id}&user=${product.seller._id}`)}
                  >
                    💬 Chat with Seller
                  </button>
                )
              )}
              {!user && product.status === 'available' && (
                <Link to="/login" className="btn btn-primary btn-lg">
                  🔐 Login to Contact Seller
                </Link>
              )}
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
            </div>
          </div>
        </div>

        <ProductSocial productId={product._id} />

        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
          </div>
        )}
      </div>
    </main>
  );
}
