import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import FeedbackSection from '../components/feedback/FeedbackSection';
import api from '../api/axios';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothing', 'Furniture', 'Stationery', 'Sports', 'Other'];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy]     = useState('newest');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)              params.search   = search;
      if (category !== 'All') params.category = category;
      if (minPrice)           params.minPrice  = minPrice;
      if (maxPrice)           params.maxPrice  = maxPrice;
      if (sortBy)             params.sortBy    = sortBy;

      const { data } = await api.get('/products', { params });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 350);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <main className="page-content">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow">🏛️ NIT Patna Student Marketplace</div>
          <h1 className="hero-title">
            Buy &amp; Sell<br />
            <span className="gradient">Within Your Campus</span>
          </h1>
          <p className="hero-subtitle">
            The trusted marketplace for NIT Patna students. Find great deals on textbooks,
            electronics, and more — all from your campus community.
          </p>
          <div className="hero-cta">
            {isAuthenticated ? (
              <Link to="/sell" className="btn btn-primary btn-lg">+ List an Item</Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
            )}
            <a href="#listings" className="btn btn-secondary btn-lg">Browse Listings</a>
            <a href="#feedback" className="btn btn-secondary btn-lg">Give Feedback</a>
          </div>
        </section>

        {/* Filters */}
        <div id="listings" className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              id="search-input"
              className="form-input"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="category-filter"
            className="form-select filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select
            className="form-select filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="lowest">Price: Low to High</option>
            <option value="highest">Price: High to Low</option>
          </select>

          <input
            id="min-price"
            className="form-input filter-select"
            placeholder="Min ₹"
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{ maxWidth: 110 }}
          />
          <input
            id="max-price"
            className="form-input filter-select"
            placeholder="Max ₹"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ maxWidth: 110 }}
          />
        </div>

        {/* Listings */}
        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No listings found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>

      <FeedbackSection />
    </main>
  );
}
