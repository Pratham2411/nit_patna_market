import { useState } from 'react';
import {
  resolveProductImageList,
  handleProductImageError,
} from '../utils/productImage';

export default function ProductImageGallery({ product, alt }) {
  const sources = resolveProductImageList(product);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, sources.length - 1);

  if (sources.length <= 1) {
    return (
      <div className="detail-image-wrap">
        <img
          src={sources[0]}
          alt={alt}
          onError={handleProductImageError}
        />
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="detail-image-wrap product-gallery-main">
        <img
          src={sources[safeIndex]}
          alt={alt}
          onError={handleProductImageError}
        />
        <span className="product-gallery-counter">
          {safeIndex + 1} / {sources.length}
        </span>
      </div>
      <div className="product-gallery-thumbs" role="tablist" aria-label="Product photos">
        {sources.map((src, i) => (
          <button
            key={src + i}
            type="button"
            role="tab"
            aria-selected={i === safeIndex}
            className={`product-gallery-thumb ${i === safeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            <img src={src} alt="" onError={handleProductImageError} />
          </button>
        ))}
      </div>
    </div>
  );
}
