import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api
      .get('/announcements/active')
      .then(({ data }) => {
        if (!data) {
          setAnnouncement(null);
          return;
        }
        const key = `announcement-dismiss-${data._id}`;
        const wasDismissed = sessionStorage.getItem(key) === '1';
        setDismissed(wasDismissed);
        setAnnouncement(data);
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    if (announcement?._id) {
      sessionStorage.setItem(`announcement-dismiss-${announcement._id}`, '1');
    }
    setDismissed(true);
  };

  if (!announcement || dismissed) return null;

  return (
    <div className="site-announcement-bar" role="status">
      <div className="container site-announcement-inner">
        <span className="site-announcement-icon" aria-hidden="true">📢</span>
        <p className="site-announcement-text">{announcement.message}</p>
        <button
          type="button"
          className="site-announcement-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
        >
          ×
        </button>
      </div>
    </div>
  );
}
