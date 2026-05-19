import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Conversations() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [convs, setConvs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConvs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">All your conversations with buyers and sellers.</p>

        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : convs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Browse listings and click &quot;Chat with Seller&quot; to start.</p>
          </div>
        ) : (
          <div className="conv-list">
            {convs.map((conv, i) => {
              const fallback = `https://picsum.photos/seed/${encodeURIComponent(conv.product?.title || i)}/48/48`;
              const isMe = conv.lastMessage.sender._id === user?.id;
              return (
                <div
                  key={i}
                  className="conv-item"
                  onClick={() =>
                    navigate(`/chat/${conv.product._id}/${conv.otherUser._id}`)
                  }
                >
                  <img
                    className="conv-item-img"
                    src={conv.product?.imageUrl || fallback}
                    alt={conv.product?.title}
                    onError={e => { e.target.src = fallback; }}
                  />
                  <div className="conv-item-body">
                    <div className="conv-item-title">{conv.product?.title}</div>
                    <div className="conv-item-sub">
                      {isMe ? 'You: ' : `${conv.otherUser.name}: `}
                      {conv.lastMessage.text}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                    {conv.unread > 0 && (
                      <span className="conv-unread-badge">{conv.unread}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
