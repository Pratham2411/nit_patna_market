import { useRef } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import { MAX_LISTING_IMAGES } from '../utils/productImage';

/**
 * Multi-image picker with previews and remove (×) before submit.
 * @param {Array<{ id: string, preview: string, path?: string, isExisting?: boolean }>} items
 */
export default function ImageUploader({
  items,
  onAddFiles,
  onRemove,
  disabled = false,
  label = 'Photos',
  hint,
}) {
  const fileRef = useRef(null);
  const atMax = items.length >= MAX_LISTING_IMAGES;

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    onAddFiles(files);
  };

  return (
    <div className="image-uploader">
      <div className="image-uploader-header">
        <label className="form-label">{label}</label>
        <span className="image-uploader-count">
          {items.length} / {MAX_LISTING_IMAGES}
        </span>
      </div>

      {hint && <p className="image-uploader-hint">{hint}</p>}

      <div className="image-uploader-grid">
        {items.map((item) => (
          <div key={item.id} className="image-uploader-tile">
            <img src={item.preview} alt="" />
            {item.isExisting && (
              <span className="image-uploader-saved">Saved</span>
            )}
            <button
              type="button"
              className="image-uploader-remove"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}

        {!atMax && (
          <button
            type="button"
            className="image-uploader-add"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
          >
            <span className="image-uploader-add-icon">+</span>
            <span>Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />
    </div>
  );
}

export function buildExistingImageItem(path) {
  return {
    id: `existing-${path}`,
    path,
    preview: mediaUrl(path),
    isExisting: true,
  };
}

export function buildPendingImageItem(file) {
  return {
    id: `pending-${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
    file,
    preview: URL.createObjectURL(file),
    isExisting: false,
  };
}

export function revokePendingPreviews(items) {
  items.forEach((item) => {
    if (!item.isExisting && item.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(item.preview);
    }
  });
}
