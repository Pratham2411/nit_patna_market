# 05 — Chat System Explained

## Design Decision: Polling vs WebSockets

### What are WebSockets?
WebSockets maintain a persistent, two-way connection between client and server. Messages are pushed from server to client instantly.

### Why we chose Polling instead

| | WebSocket | Our Polling |
|--|-----------|-------------|
| Setup complexity | High (socket.io, CORS config, event system) | Zero — just `setInterval` |
| Server requirement | Stateful (can't easily scale horizontally) | Stateless REST — works with any server |
| Latency | Instant (real-time) | Up to ~15 seconds (`ChatPanel.jsx`) |
| For this use case | Overkill | Sufficient |
| Explain in interview | Harder | Simple and honest |

**The honest answer:** For a college marketplace, a 3-second delay between messages is completely acceptable. Students are not doing high-frequency trading. WebSockets would be the right choice if we needed sub-second latency (live games, financial tickers, etc.).

---

## How the Chat Works End-to-End

### Starting a Chat

1. Buyer views a product listing (`ProductDetail.jsx`)
2. Clicks **"💬 Chat with Seller"**
3. App navigates to `/messages?product=<id>&user=<sellerId>` (draft chat if no messages yet)
4. `Conversations.jsx` + `ChatPanel.jsx` load the thread; `/chat/:productId/:otherUserId` also exists

### Fetching Messages

```js
// Chat.jsx
const fetchMessages = useCallback(async () => {
  const { data } = await api.get(`/messages/${productId}/${otherUserId}`);
  setMessages(data);
}, [productId, otherUserId]);

useEffect(() => {
  fetchMessages();                               // Fetch immediately on mount
  const poll = setInterval(fetchMessages, 3000); // Then every 3 seconds
  return () => clearInterval(poll);              // Stop when component unmounts
}, [fetchMessages]);
```

### Backend: Fetching a Thread

```js
// GET /api/messages/:productId/:otherUserId
const messages = await Message.find({
  product: productId,
  $or: [
    { sender: userId,      receiver: otherUserId }, // Messages I sent
    { sender: otherUserId, receiver: userId      }, // Messages they sent
  ],
})
  .populate('sender', 'name')
  .sort({ createdAt: 1 }); // Oldest first (chat order)

// Mark their messages to me as read
await Message.updateMany(
  { product: productId, sender: otherUserId, receiver: userId, read: false },
  { read: true }
);
```

The `$or` operator fetches messages in both directions — this gives us the complete conversation thread.

Auto-marking as read happens **when you open the chat**, not when you see individual messages. This is the same approach used by many chat apps for simplicity.

### Sending a Message

```js
// Frontend — Chat.jsx
const handleSend = async () => {
  const { data } = await api.post('/messages', {
    productId,
    receiverId: otherUserId,
    text: text.trim(),
  });
  setMessages(prev => [...prev, data]); // Optimistic update
  setText('');
};

// Enter key handler
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

```js
// Backend — POST /api/messages
const message = await Message.create({
  product:  productId,
  sender:   req.user.id,   // From JWT token — can't be faked
  receiver: receiverId,
  text:     text.trim(),
});
await message.populate('sender', 'name');
res.status(201).json(message);
```

---

## Read Receipts

Messages have a `read: Boolean` field (default `false`).

```js
// In the chat UI
<div className="chat-bubble-meta">
  {isSent && (
    <span>{msg.read ? ' ✓✓' : ' ✓'}</span>
    // ✓✓ = delivered and read
    // ✓  = sent but not yet seen
  )}
</div>
```

When the **receiver opens** the chat → backend marks all unread messages from the sender as `read: true`. The **next polling cycle** (within 3 seconds) updates the sender's UI from ✓ to ✓✓.

---

## Unread Badge in Navbar

```js
// Navbar.jsx
const [unread, setUnread] = useState(0);

useEffect(() => {
  if (!user) { setUnread(0); return; }

  const fetchCount = () =>
    api.get('/messages/unread-count')
      .then(({ data }) => setUnread(data.count));

  fetchCount();
  const t = setInterval(fetchCount, 10000); // Every 10 seconds (less aggressive)
  return () => clearInterval(t);
}, [user]);
```

```js
// Backend
const count = await Message.countDocuments({
  receiver: req.user.id,
  read: false,
});
```

The Navbar polls **every 10 seconds** (vs chat window's 3 seconds) — less aggressive because the user may not be actively in a chat.

---

## Conversations Inbox

The conversations list groups all messages into unique conversations:

```js
// Backend: GET /api/messages/conversations
const messages = await Message.find({
  $or: [{ sender: userId }, { receiver: userId }]
})
  .populate('sender receiver product')
  .sort({ createdAt: -1 }); // Newest first

const convMap = new Map();
for (const msg of messages) {
  const otherUser = msg.sender._id === userId ? msg.receiver : msg.sender;
  const key = `${msg.product._id}-${otherUser._id}`; // Unique per product+person pair

  if (!convMap.has(key)) {
    convMap.set(key, { product, otherUser, lastMessage: msg, unread: 0 });
  }
  if (!msg.read && msg.receiver._id === userId) {
    convMap.get(key).unread++;
  }
}
return [...convMap.values()];
```

The `Map` ensures we only keep the **first occurrence** of each conversation (which is the latest message, since we sorted by `createdAt: -1`).

---

## Limitations & How to Improve

### Current limitations:
1. **3-second delay** — not true real-time
2. **No typing indicators**
3. **No delete message**
4. **Polling continues even when tab is not active**

### How to fix:
```js
// Stop polling when tab is hidden (browser Page Visibility API)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInterval(poll);
  else poll = setInterval(fetchMessages, 3000);
});
```

### WebSocket upgrade path:
If real-time was needed, switch to **Socket.io**:
- Server: `io.emit('new-message', message)` after saving to MongoDB
- Client: `socket.on('new-message', (msg) => setMessages(prev => [...prev, msg]))`
- MongoDB still stores all messages (Socket.io just handles delivery)
