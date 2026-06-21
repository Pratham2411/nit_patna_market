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
    <main className="page-content">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="page-title">{isEdit ? 'Edit Listing' : 'List an Item'}</h1>
        <p className="page-subtitle">
          {isEdit
            ? 'Update details and photos. Tap × to remove any image before saving.'
            : 'Add up to 8 photos. Tap × to remove before publishing.'}
        </p>

        <div className="glass-card">
          <form id="sell-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="sell-title">Item Title *</label>
              <input
                id="sell-title"
                className="form-input"
                name="title"
                placeholder="e.g. Engineering Mathematics Vol. 1"
                value={form.title}
                onChange={handleChange}
                required
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

              <div className="form-group">
                <label className="form-label" htmlFor="sell-price">Price (₹) *</label>
                <input
                  id="sell-price"
                  className="form-input"
                  name="price"
                  type="number"
                  min="1"
                  placeholder="e.g. 250"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sell-description">Description *</label>
              <textarea
                id="sell-description"
                className="form-textarea"
                name="description"
                placeholder="Describe the condition, edition, any defects, etc."
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <ImageUploader
              items={imageItems}
              onAddFiles={handleAddFiles}
              onRemove={handleRemoveImage}
              disabled={loading}
              label={`Photos * (up to ${MAX_LISTING_IMAGES})`}
              hint="JPG, PNG, WEBP · Max 5MB each · First photo is the cover image"
            />

            {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                id="sell-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> {isEdit ? 'Saving…' : 'Publishing…'}</>
                  : isEdit ? '💾 Save Changes' : '🚀 Publish Listing'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
