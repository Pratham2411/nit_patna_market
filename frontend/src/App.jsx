import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import SellItem from './pages/SellItem';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Conversations from './pages/Conversations';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Requests from './pages/Requests';

import AdminRoute from './components/AdminRoute';

function shouldShowSplash() {
  try {
    return !sessionStorage.getItem('splash_shown');
  } catch {
    return false;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    try { sessionStorage.setItem('splash_shown', '1'); } catch { /* ignore */ }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
          <Route path="/sell/:id" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
          <Route path="/chat/:productId/:otherUserId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
