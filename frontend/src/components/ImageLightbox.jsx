import { useState, useEffect } from 'react';

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Close on Escape key, navigate on arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">×</button>
      
      {images.length > 1 && (
        <>
          <button className="lightbox-nav-btn left" onClick={handlePrev} aria-label="Previous image">‹</button>
          <button className="lightbox-nav-btn right" onClick={handleNext} aria-label="Next image">›</button>
        </>
      )}

      <div className="lightbox-content" onClick={(e) => {
        // If clicking the empty space in the content wrapper, close the lightbox
        if (e.target.className === 'lightbox-content') onClose();
      }}>
        <img 
          src={images[currentIndex]} 
          alt={`View ${currentIndex + 1}`}
          className={`lightbox-image ${isZoomed ? 'zoomed' : ''}`}
          onClick={toggleZoom}
          style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
        />
      </div>

      {images.length > 1 && (
        <div className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
