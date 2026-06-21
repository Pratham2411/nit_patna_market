import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ImageUploader, {
  buildExistingImageItem,
  buildPendingImageItem,
  revokePendingPreviews,
} from '../components/ImageUploader';
import { MAX_LISTING_IMAGES, getProductImages } from '../utils/productImage';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];

export default function SellItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  useEffect(() => {
    if (user && !user.phone) {
      alert('Please add a valid phone number in your profile before listing or requesting items.');
      navigate('/profile');
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'Books',
  });
  const [imageItems, setImageItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const imageItemsRef = useRef(imageItems);

  useEffect(() => {
    imageItemsRef.current = imageItems;
  }, [imageItems]);

  useEffect(() => {
    return () => revokePendingPreviews(imageItemsRef.current);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setForm({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
        });
        const urls = getProductImages(data);
        setImageItems(urls.map(buildExistingImageItem));
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setCategory = (cat) => setForm(prev => ({ ...prev, category: cat }));

  const handleAddFiles = (files) => {
    setError('');
    const room = MAX_LISTING_IMAGES - imageItems.length;
    if (room <= 0) {
      setError(`Maximum ${MAX_LISTING_IMAGES} photos allowed`);
      return;
    }
    const toAdd = files.slice(0, room).map(buildPendingImageItem);
    if (files.length > room) {
      setError(`Only ${room} more photo${room === 1 ? '' : 's'} can be added`);
    }
    setImageItems((prev) => [...prev, ...toAdd]);
  };

  const handleRemoveImage = (itemId) => {
    setImageItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item && !item.isExisting && item.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.price || !form.category) {
      setError('Title, Price, and Category are required');
      return;
    }
    if (!imageItems.length) {
      setError('Add at least one photo of your item');
      return;
    }
    if (Number(form.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description); // Optional visually, but keeping it
      payload.append('price', form.price);
      payload.append('category', form.category);

      imageItems
        .filter((item) => !item.isExisting && item.file)
        .forEach((item) => payload.append('images', item.file));

      if (isEdit) {
        const keepImages = imageItems
          .filter((item) => item.isExisting && item.path)
          .map((item) => item.path);
        payload.append('keepImages', JSON.stringify(keepImages));
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loader-page"><div className="spinner" /></div>;

  return (
    <main className="page-content" style={{ paddingBottom: '120px', background: 'var(--bg-base)' }}>
      <div className="container sell-container">
        
        <div style={{ marginBottom: '24px' }}>
          <h1 className="page-title" style={{ marginBottom: '8px' }}>{isEdit ? 'Edit Listing' : 'What are you selling?'}</h1>
          <p className="page-subtitle">Tap and type to list your item instantly.</p>
        </div>

        <form id="sell-form" onSubmit={handleSubmit} className="sell-form-layout">
          
          <div className="sell-form-main">
          {/* Card 1: Photos */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📷</span> Photos
            </h3>
            <ImageUploader
              items={imageItems}
              onAddFiles={handleAddFiles}
              onRemove={handleRemoveImage}
              disabled={loading}
              label=""
              hint="Add up to 8 photos. First photo is the cover."
            />
          </div>

          {/* Card 2: Details */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span> Details
            </h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <input
                id="sell-title"
                name="title"
                placeholder="Title (e.g. Engineering Math Book)"
                value={form.title}
                onChange={handleChange}
                required
                className="form-input"
                style={{ fontSize: '1.1rem', padding: '16px', borderRadius: '12px', background: 'var(--bg-body)', border: 'none' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                id="sell-description"
                name="description"
                placeholder="Description (Optional) Condition, edition, defects..."
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="form-textarea"
                style={{ fontSize: '1rem', padding: '16px', borderRadius: '12px', background: 'var(--bg-body)', border: 'none', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Card 3: Categorization */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏷️</span> Category
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '24px',
                    border: form.category === cat ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: form.category === cat ? 'var(--accent)' : 'var(--bg-body)',
                    color: form.category === cat ? 'white' : 'var(--text-primary)',
                    fontWeight: form.category === cat ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.95rem'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Card 4: Pricing */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💰</span> Price
            </h3>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem',
                color: 'var(--text-muted)',
                fontWeight: 'bold'
              }}>₹</span>
              <input
                id="sell-price"
                name="price"
                type="number"
                min="1"
                placeholder="0"
                value={form.price}
                onChange={handleChange}
                required
                className="form-input"
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '16px 16px 16px 40px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-body)', 
                  border: 'none',
                  fontWeight: 'bold'
                }}
              />
            </div>
          </div>

          {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
          </div>

          {/* Sticky Sidebar Actions (Web) / Bottom Bar Actions (Mobile) */}
          <div className="sell-action-bar">
            <div className="sell-action-inner">
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                id="sell-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> {isEdit ? 'Saving…' : 'Publishing…'}</>
                  : isEdit ? '💾 Save Changes' : '🚀 Publish Item'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
