import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import ChatPanel from '../components/ChatPanel';

const CONVERSATIONS_REFRESH_INTERVAL = 30000;

const formatTime = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function Conversations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchConvs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/messages/conversations');
      setConvs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConvs();
    const t = setInterval(() => fetchConvs(true), CONVERSATIONS_REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [fetchConvs]);

  useEffect(() => {
    const pid = searchParams.get('product');
    const oid = searchParams.get('user');
    if (!pid || !oid || !convs.length) return;
    const match = convs.find(
      (c) => String(c.product._id) === pid && String(c.otherUser._id) === oid
    );
    if (match) setSelected(match);
  }, [searchParams, convs]);

  const selectConv = (conv) => {
    setSelected(conv);
    navigate(`/messages?product=${conv.product._id}&user=${conv.otherUser._id}`, { replace: true });
  };

  const totalUnread = convs.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <main className="page-content">
      <div className="container inbox-page">
        <div className="inbox-header">
          <div>
            <h1 className="page-title">Inbox</h1>
            <p className="page-subtitle">
              {totalUnread > 0
                ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}`
                : 'Select a conversation to reply'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchConvs(true)}
            disabled={refreshing}
          >
            {refreshing ? <span className="spinner" /> : '↻ Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : convs.length === 0 ? (
          <div className="empty-state inbox-empty">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Open a listing and tap &quot;Chat with Seller&quot; to start.</p>
          </div>
        ) : (
          <div className="inbox-split">
            <div className="inbox-list">
              {convs.map((conv) => {
                const key = `${conv.product._id}-${conv.otherUser._id}`;
                const fallback = `https://picsum.photos/seed/${encodeURIComponent(conv.product?.title || key)}/96/96`;
                const isMe = String(conv.lastMessage.sender._id) === String(user?.id);
                const roleLabel = conv.otherRole === 'seller' ? 'Seller' : 'Buyer';
                const otherInitial = conv.otherUser.name?.charAt(0)?.toUpperCase() || '?';
                const isActive = selected && String(selected.product._id) === String(conv.product._id)
                  && String(selected.otherUser._id) === String(conv.otherUser._id);

                return (
                  <button
                    key={key}
                    type="button"
                    className={`inbox-item ${conv.unread > 0 ? 'has-unread' : ''} ${isActive ? 'active' : ''}`}
                    onClick={() => selectConv(conv)}
                  >
                    <img
                      className="inbox-item-img"
                      src={mediaUrl(conv.product?.imageUrl) || fallback}
                      alt=""
                      onError={(e) => { e.target.src = fallback; }}
                    />
                    <div className="inbox-item-body">
                      <div className="inbox-item-top">
                        <span className="inbox-item-title">{conv.product?.title}</span>
                        <span className="inbox-item-time">{formatTime(conv.lastMessage.createdAt)}</span>
                      </div>
                      <div className="inbox-item-meta">
                        <span className="inbox-role-badge">{roleLabel}</span>
                        <span className="inbox-person">
                          <span className="user-avatar user-avatar-xs" aria-hidden="true">
                            {conv.otherUser.avatarUrl ? (
                              <img src={mediaUrl(conv.otherUser.avatarUrl)} alt="" />
                            ) : (
                              <span>{otherInitial}</span>
                            )}
                          </span>
                          {conv.otherUser.name}
                        </span>
                        <span>·</span>
                        <span>₹{Number(conv.product?.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <p className={`inbox-item-preview ${conv.unread > 0 ? 'unread' : ''}`}>
                        {isMe ? 'You: ' : ''}{conv.lastMessage.text}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="inbox-unread-pill">{conv.unread}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="inbox-chat-pane">
              {selected ? (
                <ChatPanel
                  key={`${selected.product._id}-${selected.otherUser._id}`}
                  productId={selected.product._id}
                  otherUserId={selected.otherUser._id}
                  otherUser={selected.otherUser}
                  product={selected.product}
                  compact
                />
              ) : (
                <div className="inbox-chat-placeholder">
                  <span>💬</span>
                  <p>Select a conversation to view messages and reply</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
