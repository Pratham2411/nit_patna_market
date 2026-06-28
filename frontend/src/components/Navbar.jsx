import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import AdminBadge from './AdminBadge';
import NotificationBell from './notifications/NotificationBell';
import { mediaUrl } from '../utils/mediaUrl';

const NitpLogo = () => (
  <img src="/nitp-logo.png" alt="NIT Patna" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
);

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    const fetch = () =>
      api
        .get('/messages/unread-count')
        .then(({ data }) => setUnread(data.count))
        .catch(() => {});

    fetch();
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = useCallback(() => {
    logout();
    setMobileOpen(false);
    navigate('/');
  }, [logout, navigate]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <NitpLogo />
            </div>
            NIT Patna Market
          </Link>

          {/* Notification bell and Wishlist — visible on both mobile and desktop */}
          <div className="navbar-actions-mobile">
            {user && (
              <Link to="/wishlist" className="nav-icon-btn" title="Wishlist">
                <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </Link>
            )}
            <NotificationBell />
          </div>

          {/* Desktop links */}
          <div className="navbar-links">
            <Link to="/" className="nav-link">Browse</Link>
            <Link to="/requests" className="nav-link">Requests</Link>

            {/* Theme toggle */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                <Link to="/profile" className="nav-user-info" title="Open profile">
                  <span className="nav-user-avatar" aria-hidden="true">
                    {user?.avatarUrl ? (
                      <img src={mediaUrl(user.avatarUrl)} alt="" />
                    ) : (
                      <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </span>
                  <span className="nav-user-name">{user?.name?.split(' ')[0]}</span>
                  {isAdmin && <AdminBadge />}
                </Link>

                <Link to="/dashboard" className="nav-link">My Listings</Link>

                <Link to="/messages" className="nav-icon-btn" title="Messages">
                  <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="nav-icon-label">Inbox</span>
                  {unread > 0 && (
                    <span className="nav-unread-count">{unread > 99 ? '99+' : unread}</span>
                  )}
                </Link>

                {isAdmin && <Link to="/admin" className="nav-link">Admin</Link>}

                <Link to="/sell" className="btn btn-primary btn-sm">+ Sell</Link>
                <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      <div
        className={`mobile-drawer-overlay${mobileOpen ? ' open' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="navbar-logo" onClick={closeMobile}>
            <div className="logo-icon"><NitpLogo /></div>
            NIT Patna
          </Link>
          <button type="button" className="mobile-drawer-close" onClick={closeMobile} aria-label="Close menu">
            ✕
          </button>
        </div>

        <Link to="/" className="mobile-nav-link" onClick={closeMobile}>
          🏠 Browse
        </Link>
        <Link to="/requests" className="mobile-nav-link" onClick={closeMobile}>
          📢 Requests
        </Link>

        <button type="button" className="mobile-nav-link" onClick={() => { toggleTheme(); }}>
          {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {user ? (
          <>
            <Link to="/profile" className="mobile-nav-link" onClick={closeMobile}>
              👤 Profile
            </Link>
            <Link to="/dashboard" className="mobile-nav-link" onClick={closeMobile}>
              📦 My Listings
            </Link>
            <Link to="/wishlist" className="mobile-nav-link" onClick={closeMobile}>
              🤍 Wishlist
            </Link>
            <Link to="/messages" className="mobile-nav-link" onClick={closeMobile}>
              💬 Inbox {unread > 0 && `(${unread})`}
            </Link>
            <Link to="/sell" className="mobile-nav-link" onClick={closeMobile}>
              ➕ Sell Item
            </Link>
            {isAdmin && (
              <Link to="/admin" className="mobile-nav-link" onClick={closeMobile}>
                ⚙️ Admin
              </Link>
            )}
            <button type="button" className="mobile-nav-link" onClick={handleLogout}>
              🚪 Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mobile-nav-link" onClick={closeMobile}>
              🔑 Login
            </Link>
            <Link to="/register" className="mobile-nav-link" onClick={closeMobile}>
              ✨ Join Free
            </Link>
          </>
        )}
      </div>
    </>
  );
}
