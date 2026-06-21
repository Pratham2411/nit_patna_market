import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';

export default function Wishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        if (!user?.wishlist?.length) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // We could build a specific route like GET /products/wishlist, 
        // but for now we can fetch all and filter, or make individual requests
        // A better approach is to use Promise.all for each ID if no bulk route exists.
        const reqs = user.wishlist.map(id => api.get(`/products/${id}`));
        const responses = await Promise.allSettled(reqs);
        const validProducts = responses
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data);
        
        setProducts(validProducts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user?.wishlist]);

  return (
    <main className="page-content">
      <div className="container">
        <h1 className="page-title">My Wishlist</h1>
        
        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤍</div>
            <h3>Your wishlist is empty</h3>
            <p>Save items you like to view them later.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
