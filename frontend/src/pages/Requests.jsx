import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];

export default function Requests() {
  const { user, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Please login first");
    
    try {
      await api.post('/requests', { title, description, category });
      setShowForm(false);
      setTitle('');
      setDescription('');
      fetchRequests();
    } catch (err) {
      alert('Failed to post request');
    }
  };

  const handleFulfill = async (id) => {
    try {
      await api.patch(`/requests/${id}/status`, { status: 'fulfilled' });
      fetchRequests();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <main className="page-content">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Item Requests</h1>
          {isAuthenticated && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Request an Item'}
            </button>
          )}
        </div>

        {showForm && (
          <div className="auth-card" style={{ marginBottom: '2rem', maxWidth: '100%' }}>
            <h2>What are you looking for?</h2>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Title</label>
                <input required className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Engineering Graphics Kit" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea required className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe what you need..." />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Request</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <h3>No requests right now</h3>
            <p>Be the first to ask for an item!</p>
          </div>
        ) : (
          <div className="requests-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map(req => (
              <div key={req._id} style={{ background: 'var(--surface-2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: req.status === 'fulfilled' ? 'var(--text-muted)' : 'inherit', textDecoration: req.status === 'fulfilled' ? 'line-through' : 'none' }}>
                      {req.title}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>{req.description}</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '14px' }}>
                      <span className="badge badge-gray">{req.category}</span>
                      <span>Requested by: <strong>{req.requester.name}</strong> {req.requester.isVerifiedStudent && '🎓'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {req.status === 'open' ? (
                      <span className="badge badge-blue">Open</span>
                    ) : (
                      <span className="badge badge-green">Fulfilled</span>
                    )}
                    
                    {req.status === 'open' && (
                      <a 
                        href={`mailto:${req.requester.email}?subject=Regarding your request for ${req.title} on NITP Market`}
                        className="btn btn-secondary btn-sm"
                      >
                        I have this
                      </a>
                    )}

                    {user?.id === req.requester._id && req.status === 'open' && (
                      <button onClick={() => handleFulfill(req._id)} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>Mark as Fulfilled</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
