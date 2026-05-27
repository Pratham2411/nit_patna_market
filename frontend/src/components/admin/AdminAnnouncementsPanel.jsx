import { useState } from 'react';
import api from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';
import PriorityBadge from '../ui/PriorityBadge';
import { formatDateTime } from '../../utils/formatDate';

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const EMPTY_FORM = {
  title: '',
  message: '',
  priority: 'normal',
  expiresAt: '',
};

export default function AdminAnnouncementsPanel({
  announcements,
  onRefresh,
  onToast,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (a) => {
    setEditingId(a._id);
    setForm({
      title: a.title || '',
      message: a.message || '',
      priority: a.priority || 'normal',
      expiresAt: a.expiresAt
        ? new Date(a.expiresAt).toISOString().slice(0, 16)
        : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        active: true,
      };
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();

      if (editingId) {
        await api.patch(`/admin/announcements/${editingId}`, payload);
        onToast('Announcement updated');
      } else {
        await api.post('/admin/announcements', payload);
        onToast('Announcement published');
      }
      resetForm();
      onRefresh();
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Save failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await api.patch(`/admin/announcements/${id}`, { active: !active });
      onToast(active ? 'Announcement hidden' : 'Announcement activated');
      onRefresh();
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Action failed'), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement permanently?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      if (editingId === id) resetForm();
      onToast('Announcement deleted');
      onRefresh();
    } catch (err) {
      onToast(getApiErrorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-grid">
        <div className="admin-form-card glass-card">
          <h3 className="admin-panel-card-title">
            {editingId ? 'Edit announcement' : 'Create announcement'}
          </h3>
          <p className="admin-panel-card-desc">
            Published announcements appear in the bell notification for all users.
          </p>
          <form onSubmit={handleSubmit} className="admin-announce-form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-ann-title">Title</label>
              <input
                id="admin-ann-title"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Short headline"
                maxLength={120}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-ann-msg">Message</label>
              <textarea
                id="admin-ann-msg"
                className="form-input"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Full announcement details..."
                rows={4}
                maxLength={1000}
                required
              />
            </div>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="admin-ann-priority">Priority</label>
                <select
                  id="admin-ann-priority"
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-ann-expires">Expires (optional)</label>
                <input
                  id="admin-ann-expires"
                  className="form-input"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="admin-form-actions">
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Publish'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-list-card">
          <div className="admin-list-header">
            <h3 className="admin-panel-card-title">All announcements</h3>
            <span className="admin-list-count">{announcements.length} total</span>
          </div>
          {announcements.length === 0 ? (
            <p className="admin-empty-state">No announcements yet. Create one to notify users.</p>
          ) : (
            <div className="admin-data-table">
              {announcements.map((a) => (
                <div key={a._id} className="admin-data-row glass-card">
                  <div className="admin-data-main">
                    <div className="admin-data-title-row">
                      <strong>{a.title || 'Untitled'}</strong>
                      <PriorityBadge priority={a.priority} />
                      <span className={`admin-status-pill ${a.active ? 'active' : 'inactive'}`}>
                        {a.active ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <p className="admin-data-message">{a.message}</p>
                    <span className="admin-data-meta">
                      {formatDateTime(a.createdAt)}
                      {a.createdBy?.name && ` · ${a.createdBy.name}`}
                      {a.expiresAt && ` · Expires ${formatDateTime(a.expiresAt)}`}
                    </span>
                  </div>
                  <div className="admin-data-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(a)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleActive(a._id, a.active)}
                    >
                      {a.active ? 'Hide' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
