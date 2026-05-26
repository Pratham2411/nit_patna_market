import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';

import '../profile.css';

export default function Profile() {
  const { user: authUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');

  const loadMe = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      const user = data.user;
      updateUser(user);
      setPhone(user.phone || '');
      setCurrentAvatarUrl(user.avatarUrl || '');
      setAvatarPreview('');
      setAvatarFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('phone', phone);
      if (avatarFile) payload.append('image', avatarFile);

      const { data } = await api.patch('/auth/me', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const user = data.user;
      updateUser(user);
      setPhone(user.phone || '');
      setCurrentAvatarUrl(user.avatarUrl || '');
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    setError('');
    setSubmitting(true);

    try {
      await api.delete('/auth/me');
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setSubmitting(false);
    }
  };

  const avatarToShow = avatarPreview || currentAvatarUrl;
  const profileInitial = authUser?.name?.charAt(0)?.toUpperCase() || 'U';

  if (loading) {
    return (
      <main className="page-content">
        <div className="container">
          <div className="loader-page" style={{ minHeight: 260 }}>
            <div className="spinner" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <div className="container">
        <div className="profile-page">
          <div className="profile-hero glass-card">
            <div className="profile-hero-avatar">
              {avatarToShow ? (
                <img
                  src={mediaUrl(avatarToShow)}
                  alt=""
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <span>{profileInitial}</span>
              )}
            </div>
            <div className="profile-hero-copy">
              <span className="profile-eyebrow">Student profile</span>
              <h1>{authUser?.name || 'Your Profile'}</h1>
              <p>{authUser?.email}</p>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="profile-grid">
            <div className="glass-card profile-card">
              <div className="profile-avatar">
                <div className="profile-avatar-ring">
                  {avatarToShow ? (
                    <img
                      src={mediaUrl(avatarToShow)}
                      alt="Avatar"
                      className="profile-avatar-img"
                      onError={(e) => {
                        e.target.src = '';
                      }}
                    />
                  ) : (
                    <span className="profile-avatar-empty">{profileInitial}</span>
                  )}
                </div>

                <label className="btn btn-secondary btn-sm profile-avatar-btn">
                  Change picture
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
              </div>

              <div className="profile-meta">
                <div className="profile-meta-row">
                  <span className="profile-meta-label">Name</span>
                  <span className="profile-meta-value">{authUser?.name || 'Student'}</span>
                </div>
                <div className="profile-meta-row">
                  <span className="profile-meta-label">Email</span>
                  <span className="profile-meta-value">{authUser?.email}</span>
                </div>
              </div>
            </div>

            <div className="glass-card profile-card">
              <form className="profile-form" onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-phone">Phone number</label>
                  <input
                    id="profile-phone"
                    className="form-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <span className="spinner" /> : 'Save changes'}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteAccount} disabled={submitting}>
                    Delete account
                  </button>
                </div>
              </form>

              <p className="social-hint">
                Want to browse? <Link to="/">Go back to home</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

