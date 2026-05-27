import PriorityBadge from '../ui/PriorityBadge';
import { formatRelativeTime } from '../../utils/formatDate';

export default function AnnouncementListItem({
  item,
  onMarkRead,
  canMarkRead,
  marking,
}) {
  return (
    <article
      className={`notif-item ${item.isRead ? 'is-read' : 'is-unread'}`}
    >
      <div className="notif-item-header">
        <div className="notif-item-title-row">
          {!item.isRead && <span className="notif-unread-dot" aria-label="Unread" />}
          <h4 className="notif-item-title">{item.title}</h4>
          <PriorityBadge priority={item.priority} />
        </div>
        <time className="notif-item-time" dateTime={item.createdAt}>
          {formatRelativeTime(item.createdAt)}
        </time>
      </div>
      <p className="notif-item-message">{item.message}</p>
      {canMarkRead && !item.isRead && (
        <button
          type="button"
          className="notif-mark-read"
          onClick={() => onMarkRead(item._id)}
          disabled={marking}
        >
          Mark as read
        </button>
      )}
    </article>
  );
}
