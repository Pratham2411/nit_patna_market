import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  Books:       'badge-blue',
  Electronics: 'badge-violet',
  Clothing:    'badge-green',
  Furniture:   'badge-yellow',
  Stationery:  'badge-gray',
  Sports:      'badge-green',
  Other:       'badge-gray',
};

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const fallback = `https://picsum.photos/seed/${encodeURIComponent(product.title)}/600/400`;

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
      <div className="card-image-wrap">
        <img
          src={product.imageUrl || fallback}
          alt={product.title}
          onError={(e) => { e.target.src = fallback; }}
          loading="lazy"
        />
        <div className="card-badge">
          <span className={`badge ${CATEGORY_COLORS[product.category] || 'badge-gray'}`}>
            {product.category}
          </span>
        </div>
        {product.status === 'sold' && (
          <div className="card-sold-overlay">
            <span>Sold</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{product.title}</div>
        <div className="card-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
        <div className="card-meta">
          <span>👤</span>
          <span>{product.seller?.name || 'Unknown'}</span>
          {product.seller?.college && (
            <>
              <span>·</span>
              <span>{product.seller.college}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
