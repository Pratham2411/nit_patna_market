import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import ProductImageGallery from '../components/ProductImageGallery';
import ProductSocial from '../components/ProductSocial';
import AdminBadge from '../components/AdminBadge';

const renderDescriptionWithLinks = (text) => {
  if (!text) return null;
  // Match http, https, or www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a 
          key={i} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated } = useAuth();

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

  const handleWhatsApp = async () => {
    if (!product.seller?.phone) {
      return showToast("Seller hasn't provided a phone number", "error");
    }
    
    let text = `Hi ${product.seller.name}, I saw your listing for "${product.title}" on NITP Market. Is it still available?`;
    const formattedPhone = product.seller.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const inWishlist = user?.wishlist?.includes(product?._id);

  const toggleWishlist = async (e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');
    try {
      const isAdding = !inWishlist;
      const newWishlist = isAdding 
        ? [...(user.wishlist || []), product._id]
        : (user.wishlist || []).filter(id => id !== product._id);
      
      updateUser({ ...user, wishlist: newWishlist });

      if (isAdding) {
        await api.post(`/auth/wishlist/${product._id}`);
        showToast("Added to wishlist");
      } else {
        await api.delete(`/auth/wishlist/${product._id}`);
        showToast("Removed from wishlist");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update wishlist", "error");
    }
  };

  const sellerInitial = product?.seller?.name?.charAt(0)?.toUpperCase() || '?';

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
          <ProductImageGallery product={product} alt={product.title} />

          {/* Info */}
          <div className="detail-info">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
                {product.status === 'available' ? '✅ Available' : '🔴 Sold'}
              </span>
              <span className="badge badge-gray">{product.category}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 className="detail-title" style={{ marginBottom: 4 }}>{product.title}</h1>
                <div className="detail-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
              </div>
              {user && !isSeller && (
                <button
                  onClick={toggleWishlist}
                  title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border-color)', 
                    fontSize: '1.5rem', cursor: 'pointer', borderRadius: '50%',
                    width: '48px', height: '48px', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {inWishlist ? '❤️' : '🤍'}
                </button>
              )}
            </div>

            <p className="detail-description">{renderDescriptionWithLinks(product.description)}</p>

            <div className="detail-meta-row">
              <div className="detail-seller-card">
                <span className="user-avatar user-avatar-lg" aria-hidden="true">
                  {product.seller?.avatarUrl ? (
                    <img src={mediaUrl(product.seller.avatarUrl)} alt="" />
                  ) : (
                    <span>{sellerInitial}</span>
                  )}
                </span>
                <div>
                  <span className="detail-seller-label">Seller</span>
                  <div className="detail-seller-name">
                    <strong>{product.seller?.name}</strong>
                    {product.seller?.isVerifiedStudent && <span title="Verified NITP Student" style={{ marginLeft: 4 }}>🎓</span>}
                    {product.seller?.role === 'admin' && <AdminBadge />}
                  </div>
                </div>
              </div>

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => {
                        const sellerId = product.seller?._id || product.seller;
                        navigate(`/messages?product=${product._id}&user=${sellerId}`);
                      }}
                      style={{ width: '100%' }}
                    >
                      💬 Chat with Seller
                    </button>
                    {product.seller?.phone && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={handleWhatsApp} style={{ flex: 1, backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}>
                          📱 WhatsApp
                        </button>
                        <a href={`tel:${product.seller.phone.replace(/[^0-9+]/g, '')}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                          📞 Call
                        </a>
                      </div>
                    )}

                  </div>
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
