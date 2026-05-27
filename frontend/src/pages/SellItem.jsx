import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];

export default function SellItem() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'Books',
  });
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const fileRef = useRef();

  // Populate form in edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setForm({
          title:       data.title,
          description: data.description,
          price:       data.price,
          category:    data.category,
        });
        if (data.imageUrl) setImagePreview(mediaUrl(data.imageUrl));
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.description || !form.price || !form.category) {
      setError('All fields are required');
      return;
    }
    if (Number(form.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title',       form.title);
      payload.append('description', form.description);
      payload.append('price',       form.price);
      payload.append('category',    form.category);
      if (imageFile) payload.append('image', imageFile);

      if (isEdit) {
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
          {isEdit ? 'Update your listing details below.' : 'Fill in the details to list your item for sale.'}
        </p>

        <div className="glass-card">
          <form id="sell-form" onSubmit={handleSubmit}>
            {/* Title */}
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
              {/* Category */}
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

              {/* Price */}
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

            {/* Description */}
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

            {/* Image upload */}
            <div className="form-group">
              <label className="form-label">Product Image (optional)</label>
              <div
                className="image-upload-area"
                onClick={() => fileRef.current.click()}
              >
                <input
                  id="sell-image"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <>
                    <div className="upload-icon">🖼️</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Click to upload an image
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 6 }}>
                      JPG, PNG, WEBP · Max 5MB · A placeholder will be used if skipped
                    </p>
                  </>
                )}
              </div>
            </div>

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
                  : isEdit ? '💾 Save Changes' : '🚀 Publish Listing'
                }
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
