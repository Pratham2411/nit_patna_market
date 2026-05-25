import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';

const POLL_INTERVAL = 3000;

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDateSep = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

export default function Chat() {
  const { productId, otherUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [product, setProduct] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    api.get(`/products/${productId}`)
      .then(({ data }) => {
        setProduct(data);
        if (String(data.seller._id) !== String(user?.id)) {
          setOtherUser(data.seller);
        }
      })
      .catch(() => navigate('/messages'));
  }, [productId, user?.id, navigate]);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const { data } = await api.get(`/messages/${productId}/${otherUserId}`);
      setMessages(data);
      if (!otherUser && data.length > 0) {
        const msg = data.find((m) => String(m.sender._id) !== String(user?.id));
        if (msg) setOtherUser(msg.sender);
      }
    } catch (err) {
      if (!silent) setError(getApiErrorMessage(err, 'Failed to load messages'));
    } finally {
      setLoading(false);
    }
  }, [productId, otherUserId, user?.id, otherUser]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post('/messages', {
        productId,
        receiverId: otherUserId,
        text: text.trim(),
      });
      setMessages((prev) => [...prev, data]);
      setText('');
      textareaRef.current?.focus();
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

  const productFallback = product
    ? `https://picsum.photos/seed/${encodeURIComponent(product.title)}/48/48`
    : '';

  let lastDate = '';

  return (
    <div className="chat-layout chat-layout-v2">
      <div className="chat-header">
        <button
          type="button"
          onClick={() => navigate('/messages')}
          className="btn btn-secondary btn-sm chat-back-btn"
          aria-label="Back to inbox"
        >
          ←
        </button>

        {product && (
          <img
            className="chat-header-img"
            src={mediaUrl(product.imageUrl) || productFallback}
            alt=""
            onError={(e) => { e.target.src = productFallback; }}
          />
        )}

        <div className="chat-header-info">
          <h2>{otherUser?.name || 'Chat'}</h2>
          <p>
            <Link to={`/product/${productId}`}>{product?.title}</Link>
            {product && (
              <span className="chat-header-price">
                · ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            )}
          </p>
        </div>

        {product && (
          <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
            {product.status}
          </span>
        )}
      </div>

      <div className="chat-messages" ref={messagesRef}>
        {loading ? (
          <div className="chat-loading"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span>💬</span>
            <p>No messages yet — start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = String(msg.sender._id) === String(user?.id);
            const msgDate = new Date(msg.createdAt).toDateString();
            const showSep = msgDate !== lastDate;
            if (showSep) lastDate = msgDate;

            return (
              <div key={msg._id}>
                {showSep && (
                  <div className="chat-date-sep">{formatDateSep(msg.createdAt)}</div>
                )}
                <div className={`chat-bubble-wrap ${isSent ? 'sent' : 'received'}`}>
                  <div className="chat-bubble">{msg.text}</div>
                  <div className="chat-bubble-meta">
                    {!isSent && <span>{msg.sender.name} · </span>}
                    {formatTime(msg.createdAt)}
                    {isSent && (
                      <span className="chat-seen" title={msg.read ? 'Seen' : 'Sent'}>
                        {msg.read ? ' ✓✓' : ' ✓'}
                      </span>
                    )}
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
          placeholder="Type a message…"
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
