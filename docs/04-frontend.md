# 04 — Frontend Deep Dive

## Why Vite over Create React App?

| | Vite | Create React App |
|--|------|-----------------|
| Dev server startup | ~200ms | ~5–10 seconds |
| Hot Module Replacement | Native ESM, instant | Webpack, slower |
| Bundle size | Smaller (Rollup) | Larger (Webpack) |
| Config | Minimal | Heavily abstracted |

Vite uses **native ES Modules** in the browser during development — no bundling step, just direct imports. This is why it's so fast.

---

## Single Page Application (SPA)

The app is a SPA — there is **one HTML file** (`index.html`). React Router handles navigation by:
1. Intercepting link clicks
2. Updating the URL using the History API (no full page reload)
3. Rendering the correct component based on the URL

```js
// App.jsx
<Routes>
  <Route path="/"              element={<Home />} />
  <Route path="/product/:id"   element={<ProductDetail />} />
  <Route path="/sell"          element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
</Routes>
```

`/product/:id` — `:id` is a **URL parameter** accessed via `useParams()`:
```js
const { id } = useParams(); // e.g. "6696abc123..."
```

---

## Global State: Context API

### Why not Redux?
Redux adds significant boilerplate (actions, reducers, store, connect). For this app, we only have **one piece of global state**: the logged-in user. Context API handles this perfectly.

### How AuthContext works

```js
// AuthContext.jsx
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage so auth persists across page refreshes
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Wraps the whole app** in `App.jsx` — so every component can call `useAuth()`.

```js
// Any component
const { user, isAuthenticated, logout } = useAuth();
```

---

## Axios Instance + JWT Interceptor

```js
// api/axios.js
const api = axios.create({ baseURL: '/api' });

// This runs before EVERY request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Why an interceptor?** Without it, you'd have to manually attach the token to every single API call. The interceptor does it automatically.

**Why `baseURL: '/api'`?** In development, Vite proxies `/api/*` to `http://localhost:5001/api/*`:
```js
// vite.config.js
proxy: {
  '/api': { target: 'http://localhost:5001', changeOrigin: true }
}
```
So `api.get('/products')` becomes `http://localhost:5001/api/products` under the hood.

---

## Protected Routes

```js
// ProtectedRoute.jsx
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
```

```js
// Used in App.jsx
<Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
```

If user is not logged in → `<Navigate to="/login" replace />` redirects them. `replace` means the `/sell` URL is **replaced** in history (pressing Back won't loop back to /sell).

---

## Key React Patterns Used

### 1. Controlled Inputs
All form inputs are controlled — React state is the single source of truth:

```js
const [form, setForm] = useState({ title: '', price: '' });

const handleChange = (e) =>
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

<input name="title" value={form.title} onChange={handleChange} />
```

`[e.target.name]` — computed property key. This one handler works for ALL form fields.

### 2. Debounced Search
```js
useEffect(() => {
  const t = setTimeout(fetchProducts, 350); // Wait 350ms after last keystroke
  return () => clearTimeout(t);            // Cancel if user types again before 350ms
}, [search, category, minPrice, maxPrice]);
```

Without debounce: every keystroke fires an API call. With debounce: only fires 350ms after the user stops typing.

### 3. useCallback for Stable References

```js
const fetchMessages = useCallback(async () => {
  const { data } = await api.get(`/messages/${productId}/${otherUserId}`);
  setMessages(data);
}, [productId, otherUserId]);

// setInterval gets the same function reference, not a new one every render
useEffect(() => {
  const poll = setInterval(fetchMessages, 3000);
  return () => clearInterval(poll); // Cleanup on unmount
}, [fetchMessages]);
```

Without `useCallback`, `fetchMessages` would be a new function on every render → `useEffect` would re-run → infinite loop.

### 4. Optimistic UI in Chat
When sending a message, we append it to state **immediately** — before the server confirms:

```js
const handleSend = async () => {
  const { data } = await api.post('/messages', { productId, receiverId, text });
  setMessages(prev => [...prev, data]); // ← Show instantly
  setText('');
};
```

The polling will confirm it's in MongoDB within 3 seconds anyway. This makes the UI feel instant.

### 5. Image Fallback with `onError`

```js
<img
  src={product.imageUrl || fallbackUrl}
  onError={(e) => { e.target.src = fallbackUrl; }} // If image 404s, show placeholder
/>
```

---

## Component Hierarchy

```
App
├── AuthProvider (wraps everything)
├── BrowserRouter
│   ├── Navbar (always rendered)
│   └── Routes
│       ├── Home
│       │   └── ProductCard (many)
│       ├── ProductDetail
│       ├── Login
│       ├── Register
│       └── ProtectedRoute (wraps)
│           ├── SellItem
│           ├── Dashboard
│           │   └── DashCard (many, inline)
│           ├── Chat
│           └── Conversations
```

---

## CSS Design System

All styles live in `index.css`. This is intentional — **no CSS Modules, no Tailwind**:

- CSS custom properties (variables) define the entire color palette:
  ```css
  :root {
    --accent: #7c3aed;
    --bg-base: #08090c;
    --text-primary: #f1f5f9;
    ...
  }
  ```

- **Glassmorphism** cards: `background: rgba(255,255,255,0.04)` + `backdrop-filter: blur`

- **Animations**: `@keyframes fadeInUp` with staggered delays on product cards

- **All interactive elements have unique IDs** — good for testing and accessibility:
  ```html
  <input id="login-email" ... />
  <button id="sell-submit" ... />
  ```
