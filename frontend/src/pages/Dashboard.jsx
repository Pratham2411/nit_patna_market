import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getPrimaryProductImage, resolveProductImageSrc, handleProductImageError } from '../utils/productImage';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [filterTab, setFilterTab] = useState('All'); // All, Active, Sold

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
  
  const displayedProducts = products.filter(p => {
    if (filterTab === 'Active') return p.status === 'available';
    if (filterTab === 'Sold') return p.status === 'sold';
    return true;
  });

  return (
    <main className="page-content" style={{ paddingBottom: '100px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '2rem' }}>My Listings</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage your inventory</p>
          </div>
          <Link to="/sell" className="btn btn-primary" style={{ borderRadius: '50px', padding: '10px 20px' }}>+ Sell</Link>
        </div>

        {/* Stats / Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'All', value: products.length, filter: 'All' },
            { label: 'Active', value: available.length, filter: 'Active' },
            { label: 'Sold', value: sold.length, filter: 'Sold' },
          ].map(({ label, value, filter }) => (
            <div 
              key={label}
              onClick={() => setFilterTab(filter)}
              className="glass-card" 
              style={{ 
                flex: '1', 
                padding: '16px', 
                textAlign: 'center',
                cursor: 'pointer',
                border: filterTab === filter ? '2px solid var(--accent)' : '2px solid transparent',
                background: filterTab === filter ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
                borderRadius: '16px'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: filterTab === filter ? 'var(--accent-light)' : 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : displayedProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No {filterTab !== 'All' ? filterTab.toLowerCase() : ''} listings found</h3>
            <p style={{ marginBottom: 24 }}>{filterTab === 'All' ? 'Start by listing something you no longer need.' : 'Try changing your filter tab.'}</p>
            {filterTab === 'All' && <Link to="/sell" className="btn btn-primary">+ Create First Listing</Link>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayedProducts.map((product) => (
                <div key={product._id} className="glass-card" style={{ 
                  display: 'flex', 
                  padding: '12px', 
                  gap: '16px', 
                  alignItems: 'center',
                  borderRadius: '16px'
                }}>
                  
                  {/* Thumbnail */}
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    flexShrink: 0,
                    background: 'var(--bg-base)'
                  }}>
                    <img
                      src={resolveProductImageSrc(getPrimaryProductImage(product))}
                      alt={product.title}
                      onError={handleProductImageError}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Details */}
                  <div 
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} 
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                      <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`} style={{ fontSize: '0.65rem' }}>
                        {product.status === 'available' ? '✅ Active' : '🔴 Sold'}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: 'var(--text-primary)'
                    }}>
                      {product.title}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '1rem' }}
                        onClick={() => navigate(`/sell/${product._id}`)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '1rem' }}
                        onClick={() => handleDelete(product._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                    <button
                      className={`btn ${product.status === 'available' ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                      onClick={() => handleToggleStatus(product)}
                    >
                      {product.status === 'available' ? 'Mark Sold' : 'Mark Active'}
                    </button>
                  </div>

                </div>
            ))}
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
