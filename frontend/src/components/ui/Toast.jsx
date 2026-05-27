export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  return (
    <div className="toast-stack" role="status">
      <div className={`toast-pill toast-pill-${type}`}>
        <span>{message}</span>
        {onClose && (
          <button type="button" className="toast-pill-close" onClick={onClose} aria-label="Dismiss">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
