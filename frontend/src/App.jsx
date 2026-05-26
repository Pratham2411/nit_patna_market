import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

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

import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
          <Route path="/sell/:id" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
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

