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

/** Build a draft conversation when opening chat from a listing (no messages yet). */
function buildDraftFromProduct(product, otherUserId, currentUserId) {
  const sellerId = String(product.seller?._id || product.seller);
  const oid = String(otherUserId);

  let otherUser;
  if (oid === sellerId) {
    otherUser = {
      _id: sellerId,
      name: product.seller?.name || 'Seller',
      avatarUrl: product.seller?.avatarUrl || '',
    };
  } else if (String(currentUserId) === sellerId) {
    otherUser = { _id: oid, name: 'Buyer' };
  } else {
    return null;
  }

  return {
    product: {
      _id: product._id,
      title: product.title,
      imageUrl: product.imageUrl,
      price: product.price,
      status: product.status,
    },
    otherUser,
    lastMessage: null,
    unread: 0,
    isDraft: true,
  };
}

export default function Conversations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [draftConv, setDraftConv] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);

  const productParam = searchParams.get('product');
  const userParam = searchParams.get('user');

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

  // Open existing thread or bootstrap a new chat from ?product=&user=
  useEffect(() => {
    if (!productParam || !userParam) {
      setDraftConv(null);
      return;
    }

    const existing = convs.find(
      (c) =>
        String(c.product._id) === productParam &&
        String(c.otherUser._id) === userParam
    );
    if (existing) {
      setSelected(existing);
      setDraftConv(null);
      return;
    }

    if (loading) return;

    let cancelled = false;
    setDraftLoading(true);
    api
      .get(`/products/${productParam}`)
      .then(({ data }) => {
        if (cancelled) return;
        const draft = buildDraftFromProduct(data, userParam, user?.id);
        if (!draft) {
          setDraftConv(null);
          return;
        }
        setDraftConv(draft);
        setSelected(draft);
      })
      .catch(() => {
        if (!cancelled) setDraftConv(null);
      })
      .finally(() => {
        if (!cancelled) setDraftLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productParam, userParam, convs, loading, user?.id]);

  const selectConv = (conv) => {
    setSelected(conv);
    navigate(`/messages?product=${conv.product._id}&user=${conv.otherUser._id}`, { replace: true });
  };

  const totalUnread = convs.reduce((n, c) => n + (c.unread || 0), 0);
  const listItems = draftConv
    ? [draftConv, ...convs.filter(
        (c) =>
          String(c.product._id) !== String(draftConv.product._id) ||
          String(c.otherUser._id) !== String(draftConv.otherUser._id)
      )]
    : convs;

  const showFullEmpty =
    !loading && !draftLoading && listItems.length === 0 && !productParam;

  const activeChat = selected;

  return (
    <main className="page-content">
      <div className="container inbox-page">
        <div className="inbox-header">
          <div>
            <h1 className="page-title">Inbox</h1>
            <p className="page-subtitle">
              {totalUnread > 0
                ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}`
                : activeChat
                  ? 'Send a message to start the conversation'
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

        {loading || draftLoading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : showFullEmpty ? (
          <div className="empty-state inbox-empty">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Open a listing and tap &quot;Chat with Seller&quot; to start.</p>
          </div>
        ) : (
          <div className="inbox-split">
            <div className="inbox-list">
              {listItems.map((conv) => {
                const key = `${conv.product._id}-${conv.otherUser._id}`;
                const fallback = `https://picsum.photos/seed/${encodeURIComponent(conv.product?.title || key)}/96/96`;
                const isMe =
                  conv.lastMessage &&
                  String(conv.lastMessage.sender._id) === String(user?.id);
                const roleLabel = conv.otherRole === 'seller' ? 'Seller' : conv.isDraft ? 'Seller' : 'Buyer';
                const otherInitial = conv.otherUser.name?.charAt(0)?.toUpperCase() || '?';
                const isActive =
                  activeChat &&
                  String(activeChat.product._id) === String(conv.product._id) &&
                  String(activeChat.otherUser._id) === String(conv.otherUser._id);

                return (
                  <button
                    key={key}
                    type="button"
                    className={`inbox-item ${conv.unread > 0 ? 'has-unread' : ''} ${isActive ? 'active' : ''} ${conv.isDraft ? 'is-draft' : ''}`}
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
                        {conv.lastMessage && (
                          <span className="inbox-item-time">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
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
                        {conv.isDraft
                          ? 'New conversation — say hi!'
                          : `${isMe ? 'You: ' : ''}${conv.lastMessage.text}`}
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
              {activeChat ? (
                <ChatPanel
                  key={`${activeChat.product._id}-${activeChat.otherUser._id}`}
                  productId={activeChat.product._id}
                  otherUserId={activeChat.otherUser._id}
                  otherUser={activeChat.otherUser}
                  product={activeChat.product}
                  compact
                  onMessageSent={() => fetchConvs(true)}
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
