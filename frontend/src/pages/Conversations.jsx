import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import {
  getPrimaryProductImage,
  getProductImages,
  resolveProductImageSrc,
  handleProductImageError,
} from '../utils/productImage';
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
    contextType: 'product',
    product: {
      _id: product._id,
      title: product.title,
      imageUrl: getPrimaryProductImage(product),
      imageUrls: getProductImages(product),
      price: product.price,
      status: product.status,
    },
    otherUser,
    lastMessage: null,
    unread: 0,
    myRole: String(currentUserId) === sellerId ? 'seller' : 'buyer',
    otherRole: oid === sellerId ? 'seller' : 'buyer',
    isDraft: true,
  };
}

function buildDraftFromRequest(itemRequest, otherUserId, currentUserId) {
  const requesterId = String(itemRequest.requester?._id || itemRequest.requester);
  const oid = String(otherUserId);

  let otherUser;
  if (oid === requesterId) {
    otherUser = {
      _id: requesterId,
      name: itemRequest.requester?.name || 'Requester',
      avatarUrl: itemRequest.requester?.avatarUrl || '',
    };
  } else if (String(currentUserId) === requesterId) {
    otherUser = { _id: oid, name: 'Provider' };
  } else {
    return null;
  }

  return {
    contextType: 'request',
    itemRequest: {
      _id: itemRequest._id,
      title: itemRequest.title,
      category: itemRequest.category,
      status: itemRequest.status,
    },
    otherUser,
    lastMessage: null,
    unread: 0,
    myRole: String(currentUserId) === requesterId ? 'requester' : 'provider',
    otherRole: oid === requesterId ? 'requester' : 'provider',
    isDraft: true,
  };
}

const getContextId = (conv) => (
  conv.contextType === 'request' ? conv.itemRequest?._id : conv.product?._id
);

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
  const requestParam = searchParams.get('request');
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

  useEffect(() => {
    const contextType = requestParam ? 'request' : 'product';
    const contextId = requestParam || productParam;

    if (!contextId || !userParam) {
      setDraftConv(null);
      return;
    }

    const existing = convs.find(
      (c) =>
        (c.contextType || 'product') === contextType &&
        String(getContextId(c)) === contextId &&
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

    const request = contextType === 'request'
      ? api.get(`/requests/${contextId}`)
      : api.get(`/products/${contextId}`);

    request
      .then(({ data }) => {
        if (cancelled) return;
        const draft = contextType === 'request'
          ? buildDraftFromRequest(data, userParam, user?.id)
          : buildDraftFromProduct(data, userParam, user?.id);
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
  }, [productParam, requestParam, userParam, convs, loading, user?.id]);

  const selectConv = (conv) => {
    setSelected(conv);
    if (conv.contextType === 'request') {
      navigate(`/messages?request=${conv.itemRequest._id}&user=${conv.otherUser._id}`, { replace: true });
    } else {
      navigate(`/messages?product=${conv.product._id}&user=${conv.otherUser._id}`, { replace: true });
    }
  };

  const totalUnread = convs.reduce((n, c) => n + (c.unread || 0), 0);
  const listItems = draftConv
    ? [draftConv, ...convs.filter(
        (c) =>
          (c.contextType || 'product') !== draftConv.contextType ||
          String(getContextId(c)) !== String(getContextId(draftConv)) ||
          String(c.otherUser._id) !== String(draftConv.otherUser._id)
      )]
    : convs;

  const showFullEmpty =
    !loading && !draftLoading && listItems.length === 0 && !productParam && !requestParam;

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
            {refreshing ? <span className="spinner" /> : 'Refresh'}
          </button>
        </div>

        {loading || draftLoading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : showFullEmpty ? (
          <div className="empty-state inbox-empty">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Open a listing or request to start a conversation.</p>
          </div>
        ) : (
          <div className="inbox-split">
            <div className="inbox-list">
              {listItems.map((conv) => {
                const isRequest = conv.contextType === 'request';
                const context = isRequest ? conv.itemRequest : conv.product;
                const key = `${isRequest ? 'request' : 'product'}-${context._id}-${conv.otherUser._id}`;
                const isMe =
                  conv.lastMessage &&
                  String(conv.lastMessage.sender._id) === String(user?.id);
                const roleLabel = isRequest
                  ? conv.otherRole === 'requester' ? 'Requester' : 'Provider'
                  : conv.otherRole === 'seller' ? 'Seller' : 'Buyer';
                const otherInitial = conv.otherUser.name?.charAt(0)?.toUpperCase() || '?';
                const isActive =
                  activeChat &&
                  (activeChat.contextType || 'product') === (conv.contextType || 'product') &&
                  String(getContextId(activeChat)) === String(getContextId(conv)) &&
                  String(activeChat.otherUser._id) === String(conv.otherUser._id);

                return (
                  <button
                    key={key}
                    type="button"
                    className={`inbox-item ${conv.unread > 0 ? 'has-unread' : ''} ${isActive ? 'active' : ''} ${conv.isDraft ? 'is-draft' : ''}`}
                    onClick={() => selectConv(conv)}
                  >
                    {isRequest ? (
                      <div className="inbox-item-img inbox-item-request-icon" aria-hidden="true">?</div>
                    ) : (
                      <img
                        className="inbox-item-img"
                        src={resolveProductImageSrc(getPrimaryProductImage(conv.product))}
                        alt=""
                        onError={handleProductImageError}
                      />
                    )}
                    <div className="inbox-item-body">
                      <div className="inbox-item-top">
                        <span className="inbox-item-title">{context?.title}</span>
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
                        {isRequest ? (
                          <span>{context?.category || 'Request'}</span>
                        ) : (
                          <span>₹{Number(context?.price || 0).toLocaleString('en-IN')}</span>
                        )}
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
                  key={`${activeChat.contextType || 'product'}-${getContextId(activeChat)}-${activeChat.otherUser._id}`}
                  productId={activeChat.contextType === 'request' ? undefined : activeChat.product._id}
                  itemRequestId={activeChat.contextType === 'request' ? activeChat.itemRequest._id : undefined}
                  otherUserId={activeChat.otherUser._id}
                  otherUser={activeChat.otherUser}
                  product={activeChat.contextType === 'request' ? undefined : activeChat.product}
                  itemRequest={activeChat.contextType === 'request' ? activeChat.itemRequest : undefined}
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