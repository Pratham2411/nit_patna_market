import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import AnnouncementListItem from './AnnouncementListItem';

export default function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data);
      if (user) {
        const countRes = await api.get('/announcements/unread-count');
        setUnreadCount(countRes.data.count);
      } else {
        setUnreadCount(data.filter((a) => !a.isRead).length);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (
        panelRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleMarkRead = async (id) => {
    if (!user) return;
    setMarking(true);
    try {
      await api.post(`/announcements/${id}/read`);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    } finally {
      setMarking(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarking(true);
    try {
      await api.post('/announcements/read-all');
      setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarking(false);
    }
  };

  const badgeCount = user ? unreadCount : announcements.length;

  return (
    <div className="notif-bell-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`notif-bell-btn ${open ? 'is-open' : ''}`}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchAnnouncements();
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications${badgeCount ? `, ${badgeCount} unread` : ''}`}
      >
        <svg className="notif-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {badgeCount > 0 && (
          <span className="notif-bell-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
        )}
      </button>

      <div
        ref={panelRef}
        className={`notif-panel ${open ? 'notif-panel-open' : ''}`}
        role="menu"
        aria-hidden={!open}
      >
        <div className="notif-panel-header">
          <div>
            <h3 className="notif-panel-title">Announcements</h3>
            <p className="notif-panel-subtitle">Campus updates &amp; notices</p>
          </div>
          {user && unreadCount > 0 && (
            <button
              type="button"
              className="notif-mark-all"
              onClick={handleMarkAllRead}
              disabled={marking}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notif-panel-body">
          {loading ? (
            <div className="notif-panel-loading">
              <div className="spinner" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="notif-panel-empty">
              <span className="notif-empty-icon" aria-hidden="true">🔔</span>
              <p>No announcements yet</p>
              <span className="notif-empty-hint">Check back later for campus updates</span>
            </div>
          ) : (
            announcements.map((item) => (
              <AnnouncementListItem
                key={item._id}
                item={item}
                onMarkRead={handleMarkRead}
                canMarkRead={!!user}
                marking={marking}
              />
            ))
          )}
        </div>

        <div className="notif-panel-footer">
          {!user && (
            <p className="notif-login-hint">
              <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
              {' '}to mark announcements as read
            </p>
          )}
          {isAdmin && (
            <Link to="/admin" className="notif-admin-link" onClick={() => setOpen(false)}>
              Manage announcements →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
