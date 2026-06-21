import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { getPrimaryProductImage, resolveProductImageSrc, handleProductImageError } from '../utils/productImage';
import { getApiErrorMessage } from '../utils/apiError';
import { getGmailUrl } from '../utils/gmailUrl';

const POLL_INTERVAL = 15000;

const messagesSignature = (messages) =>
  messages.map((message) => `${message._id}:${message.read}:${message.updatedAt || message.createdAt}`).join('|');

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDateSep = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

export default function ChatPanel({
  productId,
  itemRequestId,
  otherUserId,
  otherUser: otherUserProp,
  product: productProp,
  itemRequest: itemRequestProp,
  compact = false,
  onMessageSent,
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [product, setProduct] = useState(productProp || null);
  const [itemRequest, setItemRequest] = useState(itemRequestProp || null);
  const [otherUser, setOtherUser] = useState(otherUserProp || null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (productProp) {
      setProduct(productProp);
    } else if (productId) {
      api.get(`/products/${productId}`)
        .then(({ data }) => {
          setProduct(data);
          if (!otherUserProp && String(data.seller._id) !== String(user?.id)) {
            setOtherUser(data.seller);
          }
        })
        .catch(() => setError('Could not load listing'));
    }

    if (itemRequestProp) {
      setItemRequest(itemRequestProp);
    } else if (itemRequestId) {
      api.get(`/requests/${itemRequestId}`)
        .then(({ data }) => {
          setItemRequest(data);
          if (!otherUserProp && String(data.requester?._id) !== String(user?.id)) {
            setOtherUser(data.requester);
          }
        })
        .catch(() => setError('Could not load request'));
    }

    if (otherUserProp) setOtherUser(otherUserProp);
  }, [productId, itemRequestId, productProp, itemRequestProp, otherUserProp, user?.id]);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const url = itemRequestId
        ? `/messages/request/${itemRequestId}/${otherUserId}`
        : `/messages/${productId}/${otherUserId}`;
      const { data } = await api.get(url);
      setMessages((prev) => (messagesSignature(prev) === messagesSignature(data) ? prev : data));
      if (!otherUser && data.length > 0) {
        const msg = data.find((m) => String(m.sender._id) !== String(user?.id));
        if (msg) setOtherUser(msg.sender);
      }
      setError('');
    } catch (err) {
      if (!silent) setError(getApiErrorMessage(err, 'Failed to load messages'));
    } finally {
      setLoading(false);
    }
  }, [productId, itemRequestId, otherUserId, user?.id, otherUser]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [productId, itemRequestId, otherUserId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const payload = {
        receiverId: String(otherUserId),
        text: text.trim(),
      };
      if (itemRequestId) payload.itemRequestId = itemRequestId;
      else payload.productId = productId;

      const { data } = await api.post('/messages', payload);
      setMessages((prev) => [...prev, data]);
      setText('');
      textareaRef.current?.focus();
      onMessageSent?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherInitial = otherUser?.name?.charAt(0)?.toUpperCase() || '?';
  const isRequestChat = !!itemRequestId;

  let emailSubject = '';
  let emailBody = '';
  if (otherUser) {
    if (product) {
      emailSubject = `Inquiry about "${product.title}" - NIT Patna Marketplace`;
      emailBody = `Hi ${otherUser.name},\n\nI am contacting you regarding your listing "${product.title}" (₹${product.price.toLocaleString('en-IN')}) on the NIT Patna Student Marketplace.`;
    } else if (itemRequest) {
      emailSubject = `Regarding request for "${itemRequest.title}" - NIT Patna Marketplace`;
      emailBody = `Hi ${otherUser.name},\n\nI am contacting you regarding your request for "${itemRequest.title}" on the NIT Patna Student Marketplace.`;
    } else {
      emailSubject = `Message from NIT Patna Marketplace`;
      emailBody = `Hi ${otherUser.name},\n\nI am contacting you from the NIT Patna Student Marketplace.`;
    }
  }

  const emailUrl = otherUser?.email ? getGmailUrl(otherUser.email, emailSubject, emailBody) : '';
  const isMailto = emailUrl.startsWith('mailto:');
  let lastDate = '';

  return (
    <div className={`chat-panel ${compact ? 'chat-panel-compact' : ''}`}>
      <div className="chat-panel-header">
        {product && (
          <img
            className="chat-header-img"
            src={resolveProductImageSrc(getPrimaryProductImage(product))}
            alt=""
            onError={handleProductImageError}
          />
        )}
        {isRequestChat && !product && (
          <div className="chat-header-img chat-header-request-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <path d="M9.5 9.5a1.5 1.5 0 1 1 3 0c0 1-1.5 1.5-1.5 2.5" />
              <circle cx="11" cy="14.5" r="0.5" fill="currentColor" />
            </svg>
          </div>
        )}
        <div className="chat-header-info">
          <h2 className="chat-user-heading">
            <span className="user-avatar user-avatar-sm" aria-hidden="true">
              {otherUser?.avatarUrl ? (
                <img src={mediaUrl(otherUser.avatarUrl)} alt="" />
              ) : (
                <span>{otherInitial}</span>
              )}
            </span>
            {otherUser?.name || 'Chat'}
          </h2>
          <p>
            {productId ? (
              <>
                <Link to={`/product/${productId}`}>{product?.title}</Link>
                {product && (
                  <span className="chat-header-price">
                    · ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                )}
              </>
            ) : (
              <span>{itemRequest?.title || 'Item request'}</span>
            )}
          </p>
        </div>
        {product && (
          <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
            {product.status}
          </span>
        )}
        {itemRequest && (
          <span className={`badge ${itemRequest.status === 'open' ? 'badge-blue' : 'badge-green'}`}>
            {itemRequest.status === 'open' ? 'Open request' : 'Fulfilled'}
          </span>
        )}
        <div className="chat-header-actions">
          {otherUser?.phone && (
            <a
              href={`tel:${otherUser.phone.replace(/[^0-9+]/g, '')}`}
              className="chat-action-btn"
              title={`Call ${otherUser.name}`}
              aria-label="Call"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
          )}
          {otherUser?.email && (
            <a
              href={emailUrl}
              target={isMailto ? undefined : "_blank"}
              rel={isMailto ? undefined : "noopener noreferrer"}
              className="chat-action-btn"
              title={`Email ${otherUser.name}`}
              aria-label="Email"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </a>
          )}
        </div>
      </div>

      <div className="chat-panel-messages">
        {loading ? (
          <div className="chat-loading"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span>💬</span>
            <p>No messages yet — say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = String(msg.sender._id) === String(user?.id);
            const msgDate = new Date(msg.createdAt).toDateString();
            const showSep = msgDate !== lastDate;
            if (showSep) lastDate = msgDate;

            return (
              <div key={msg._id}>
                {showSep && <div className="chat-date-sep">{formatDateSep(msg.createdAt)}</div>}
                <div className={`chat-bubble-wrap ${isSent ? 'sent' : 'received'}`}>
                  <div className="chat-bubble">{msg.text}</div>
                  <div className="chat-bubble-meta">
                    {!isSent && <span>{msg.sender.name} · </span>}
                    {formatTime(msg.createdAt)}
                    {isSent && <span className="chat-seen">{msg.read ? ' ✓✓' : ' ✓'}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="chat-error form-error">{error}</p>}

      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Type a reply..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? <span className="spinner" /> : '➤'}
        </button>
      </div>
    </div>
  );
}