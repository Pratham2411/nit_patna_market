import api from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/formatDate';

const STATUS_OPTIONS = ['all', 'open', 'read', 'resolved'];

export default function AdminFeedbackPanel({
  feedbackList,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onToast,
  onStatsUpdate,
}) {
  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/feedback/${id}`, { status });
      onRefresh();
      if (status !== 'open' && onStatsUpdate) onStatsUpdate(-1);
      onToast(`Marked as ${status}`);
      return data;
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Update failed'), 'error');
    }
  };

  const handleDelete = async (id, wasOpen) => {
    if (!confirm('Delete this feedback permanently?')) return;
    try {
      await api.delete(`/admin/feedback/${id}`);
      onRefresh();
      if (wasOpen && onStatsUpdate) onStatsUpdate(-1);
      onToast('Feedback deleted');
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Delete failed'), 'error');
    }
  };

  const filtered =
    statusFilter === 'all'
      ? feedbackList
      : feedbackList.filter((f) => f.status === statusFilter);

  return (
    <div className="admin-panel">
      <div className="admin-feedback-toolbar">
        <div className="admin-filter-pills">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`admin-filter-pill ${statusFilter === s ? 'active' : ''}`}
              onClick={() => onStatusFilterChange(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span className="admin-filter-count">
                  {feedbackList.filter((f) => f.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty-state">No feedback in this category.</p>
      ) : (
        <div className="admin-data-table">
          {filtered.map((f) => (
            <div key={f._id} className="admin-data-row glass-card admin-feedback-card">
              <div className="admin-data-main">
                <div className="admin-data-title-row">
                  <strong>{f.subject}</strong>
                  <span className={`admin-status-pill status-${f.status}`}>{f.status}</span>
                </div>
                <p className="admin-data-message">{f.message}</p>
                <span className="admin-data-meta">
                  {f.user?.name} · {f.user?.email} · {formatDateTime(f.createdAt)}
                </span>
              </div>
              <div className="admin-data-actions">
                {f.status === 'open' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => updateStatus(f._id, 'read')}
                  >
                    Mark read
                  </button>
                )}
                {f.status !== 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => updateStatus(f._id, 'resolved')}
                  >
                    Resolve
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(f._id, f.status === 'open')}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
