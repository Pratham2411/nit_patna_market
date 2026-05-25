import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';

const POLL_INTERVAL = 3000; // 3 seconds

export default function Chat() {
  const { productId, otherUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]   = useState([]);
  const [product, setProduct]     = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const textareaRef = useRef(null);

  // Fetch product info once
  useEffect(() => {
    api.get(`/products/${productId}`)
      .then(({ data }) => {
        setProduct(data);
        // The "other user" is the seller; if current user IS the seller, otherUser is determined from messages
        if (data.seller._id !== user?.id) {
          setOtherUser(data.seller);
        }
      })
      .catch(() => navigate('/'));
  }, [productId, user?.id, navigate]);

  // Fetch messages + identify other user
  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/messages/${productId}/${otherUserId}`);
      setMessages(data);
      // Derive other user name from messages if not set
      if (!otherUser && data.length > 0) {
        const msg = data.find(m => m.sender._id !== user?.id);
        if (msg) setOtherUser(msg.sender);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId, otherUserId, user?.id, otherUser]);

  // Initial fetch + start polling
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        productId,
        receiverId: otherUserId,
        text: text.trim(),
      });
      setMessages(prev => [...prev, data]);
      setText('');
      textareaRef.current?.focus();
    } catch (err) {
      console.error(err);
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

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const productFallback = product
    ? `https://picsum.photos/seed/${encodeURIComponent(product.title)}/48/48`
    : '';

  return (
    <div className="chat-layout">
      {/* Header */}
      <div className="chat-header">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 10px' }}
        >←</button>

        {product && (
          <img
            className="chat-header-img"
            src={mediaUrl(product.imageUrl) || productFallback}
            alt={product.title}
            onError={e => { e.target.src = productFallback; }}
          />
        )}

        <div className="chat-header-info">
          <h2>
            {otherUser?.name || 'Seller'}
            {otherUser?.college && (
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                · {otherUser.college}
              </span>
            )}
          </h2>
          <p>
            Re:{' '}
            <Link to={`/product/${productId}`} style={{ color: 'var(--accent-light)' }}>
              {product?.title || '…'}
            </Link>
            {product && (
              <span style={{ marginLeft: 8 }}>
                · <strong style={{ color: 'var(--accent-light)' }}>
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </strong>
              </span>
            )}
          </p>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span className={`badge ${product?.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
            {product?.status || '…'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span style={{ fontSize: '2rem' }}>💬</span>
            <span>No messages yet — say hi!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.sender._id === user?.id;
            return (
              <div
                key={msg._id}
                className={`chat-bubble-wrap ${isSent ? 'sent' : 'received'}`}
              >
                <div className="chat-bubble">{msg.text}</div>
                <div className="chat-bubble-meta">
                  {!isSent && <span>{msg.sender.name} · </span>}
                  {formatTime(msg.createdAt)}
                  {isSent && (
                    <span style={{ marginLeft: 4 }}>
                      {msg.read ? ' ✓✓' : ' ✓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          title="Send"
        >
          {sending ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}
