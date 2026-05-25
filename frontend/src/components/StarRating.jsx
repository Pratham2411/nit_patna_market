export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  return (
    <div className={`star-rating star-rating-${size}`} role={readOnly ? 'img' : 'group'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= value ? 'active' : ''}`}
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
