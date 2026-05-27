import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AdminBadge from './AdminBadge';
import NotificationBell from './notifications/NotificationBell';
import { mediaUrl } from '../utils/mediaUrl';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">🎓</div>
          NIT Patna Market
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">
            Browse
          </Link>

          <NotificationBell />

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

              <Link to="/dashboard" className="nav-link">
                My Listings
              </Link>

              <Link to="/messages" className="nav-icon-btn" title="Messages">
                <svg
                  className="nav-icon-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="nav-icon-label">Inbox</span>
                {unread > 0 && (
                  <span className="nav-unread-count">{unread > 99 ? '99+' : unread}</span>
                )}
              </Link>

              {isAdmin && <Link to="/admin" className="nav-link">Admin</Link>}

              <Link to="/sell" className="btn btn-primary btn-sm">
                + Sell
              </Link>
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
        </div>
      </div>
    </nav>
  );
}
