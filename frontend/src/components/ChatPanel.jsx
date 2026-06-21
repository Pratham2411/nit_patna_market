import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { getPrimaryProductImage, resolveProductImageSrc, handleProductImageError } from '../utils/productImage';
import { getApiErrorMessage } from '../utils/apiError';

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
          <div className="chat-header-img chat-header-request-icon" aria-hidden="true">?</div>
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