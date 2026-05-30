import { mediaUrl } from './mediaUrl';

export const MAX_LISTING_IMAGES = 8;

/** Neutral placeholder — never use random stock photos when an upload fails. */
export const LISTING_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect fill="#12141c" width="600" height="400"/>
      <rect x="200" y="120" width="200" height="140" rx="12" fill="#1e2230" stroke="#3b4258" stroke-width="2"/>
      <circle cx="260" cy="175" r="18" fill="#3b4258"/>
      <path d="M210 235 L270 190 L310 215 L350 175 L390 235 Z" fill="#3b4258"/>
      <text x="300" y="300" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="15">Photo unavailable</text>
    </svg>`
  );

export function getProductImages(product) {
  if (!product) return [];
  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    return product.imageUrls.filter(Boolean);
  }
  if (product.imageUrl && !product.imageUrl.includes('picsum.photos')) {
    return [product.imageUrl];
  }
  return [];
}

export function getPrimaryProductImage(product) {
  return getProductImages(product)[0] || '';
}

export function isLegacyRandomPlaceholder(imageUrl) {
  return typeof imageUrl === 'string' && imageUrl.includes('picsum.photos');
}

export function isHostedProductImage(imageUrl) {
  if (!imageUrl || isLegacyRandomPlaceholder(imageUrl)) return false;
  return imageUrl.startsWith('/uploads/') || imageUrl.includes('res.cloudinary.com');
}

export function resolveProductImageSrc(imageUrl) {
  if (!imageUrl || isLegacyRandomPlaceholder(imageUrl)) {
    return LISTING_IMAGE_PLACEHOLDER;
  }
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  return mediaUrl(imageUrl) || LISTING_IMAGE_PLACEHOLDER;
}

export function resolveProductImageList(product) {
  const urls = getProductImages(product);
  if (!urls.length) return [LISTING_IMAGE_PLACEHOLDER];
  return urls.map(resolveProductImageSrc);
}

/** Call from img onError — do not swap to random picsum photos. */
export function handleProductImageError(e) {
  e.target.onerror = null;
  e.target.src = LISTING_IMAGE_PLACEHOLDER;
}
