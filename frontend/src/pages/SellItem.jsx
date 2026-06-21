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

    if (!form.title || !form.description || !form.price || !form.category) {
      setError('All fields are required');
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
      payload.append('description', form.description);
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
    <main className="page-content" style={{ paddingBottom: '120px' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        
        <form id="sell-form" onSubmit={handleSubmit}>
          
          {/* Top Image Uploader - Most important part of listing! */}
          <div style={{ marginBottom: '32px' }}>
            <ImageUploader
              items={imageItems}
              onAddFiles={handleAddFiles}
              onRemove={handleRemoveImage}
              disabled={loading}
              label={`Photos * (up to ${MAX_LISTING_IMAGES})`}
              hint="Tap to add photos. First photo is the cover image."
            />
          </div>

          <div className="glass-card" style={{ padding: '32px 24px' }}>
            {/* Title - Large Typography */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <input
                id="sell-title"
                name="title"
                placeholder="What are you selling?"
                value={form.title}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid var(--border)',
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  padding: '8px 0',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'var(--font-display)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Price - Large Typography */}
            <div className="form-group" style={{ marginBottom: '32px', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 0,
                top: '12px',
                fontSize: '1.5rem',
                color: 'var(--text-muted)',
                fontWeight: '600'
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
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid var(--border)',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--accent-light)',
                  padding: '8px 0 8px 24px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="sell-category">Category *</label>
                <select
                  id="sell-category"
                  className="form-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="sell-description">Description *</label>
              <textarea
                id="sell-description"
                className="form-textarea"
                name="description"
                placeholder="Describe the condition, edition, any defects, etc."
                value={form.description}
                onChange={handleChange}
                rows={5}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && <p className="form-error" style={{ marginTop: 16 }}>{error}</p>}
          </div>

          {/* Sticky Bottom Actions */}
          <div style={{
            position: 'fixed',
            bottom: '72px', /* above bottom nav */
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: 'var(--navbar-bg)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '12px',
            zIndex: 100,
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '640px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/dashboard')}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                id="sell-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ flex: 2 }}
              >
                {loading
                  ? <><span className="spinner" /> {isEdit ? 'Saving…' : 'Publishing…'}</>
                  : isEdit ? '💾 Save Changes' : '🚀 Publish Listing'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
