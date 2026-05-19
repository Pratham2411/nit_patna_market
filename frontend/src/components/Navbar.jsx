import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Poll unread count every 10s when logged in
  useEffect(() => {
    if (!user) { setUnread(0); return; }

    const fetch = () =>
      api.get('/messages/unread-count')
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
          Campus Market
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">Browse</Link>

          {user ? (
            <>
              <span className="nav-user-info">👋 {user?.name?.split(' ')[0] ?? 'Hey'}</span>
              <Link to="/dashboard" className="nav-link">My Listings</Link>

              {/* Messages with unread dot */}
              <Link to="/messages" className="nav-link nav-msg-badge">
                💬 Messages
                {unread > 0 && <span className="unread-dot" title={`${unread} unread`} />}
              </Link>

              <Link to="/sell" className="btn btn-primary btn-sm">+ Sell Item</Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
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
