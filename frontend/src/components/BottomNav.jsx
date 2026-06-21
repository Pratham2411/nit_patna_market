import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';
import api from '../api/axios';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    const fetchUnread = () =>
      api
        .get('/messages/unread-count')
        .then(({ data }) => setUnread(data.count))
        .catch(() => {});

    fetchUnread();
    const t = setInterval(fetchUnread, 10000);
    return () => clearInterval(t);
  }, [user]);

  // Hide bottom nav if the user is not authenticated (optional, but requested in app logic)
  // Actually, we can show login on profile if not authenticated.
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">Browse</span>
      </Link>
      
      <Link to="/requests" className={`bottom-nav-item ${isActive('/requests') ? 'active' : ''}`}>
        <span className="bottom-nav-icon">📢</span>
        <span className="bottom-nav-label">Requests</span>
      </Link>

      <div className="bottom-nav-item sell-fab-wrapper">
        <Link to="/sell" className="sell-fab">
          ➕
        </Link>
        <span className="bottom-nav-label" style={{ marginTop: '24px' }}>Sell</span>
      </div>

      <Link to="/messages" className={`bottom-nav-item ${isActive('/messages') ? 'active' : ''}`}>
        <div className="bottom-nav-icon-wrapper">
          <span className="bottom-nav-icon">💬</span>
          {unread > 0 && (
            <span className="bottom-nav-badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </div>
        <span className="bottom-nav-label">Inbox</span>
      </Link>

      {user ? (
        <Link to="/profile" className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <div className="bottom-nav-avatar">
            {user?.avatarUrl ? (
              <img src={mediaUrl(user.avatarUrl)} alt="Profile" />
            ) : (
              <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <span className="bottom-nav-label">Profile</span>
        </Link>
      ) : (
        <Link to="/login" className={`bottom-nav-item ${isActive('/login') ? 'active' : ''}`}>
          <span className="bottom-nav-icon">👤</span>
          <span className="bottom-nav-label">Login</span>
        </Link>
      )}
    </div>
  );
}
