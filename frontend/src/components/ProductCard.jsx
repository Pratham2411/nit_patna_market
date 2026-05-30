import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';
import { getPrimaryProductImage, resolveProductImageSrc, handleProductImageError } from '../utils/productImage';

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
  const sellerInitial = product.seller?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
      <div className="card-image-wrap">
        <img
          src={resolveProductImageSrc(getPrimaryProductImage(product))}
          alt={product.title}
          onError={handleProductImageError}
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
        <div className="card-meta card-seller">
          <span className="user-avatar user-avatar-xs" aria-hidden="true">
            {product.seller?.avatarUrl ? (
              <img src={mediaUrl(product.seller.avatarUrl)} alt="" />
            ) : (
              <span>{sellerInitial}</span>
            )}
          </span>
          <span>{product.seller?.name || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}
