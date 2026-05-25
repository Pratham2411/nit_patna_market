import { useParams, useNavigate } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';

export default function Chat() {
  const { productId, otherUserId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="chat-layout chat-layout-v2 page-content">
      <div className="container" style={{ maxWidth: 900, padding: 0 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ margin: '12px 0' }}
          onClick={() => navigate('/messages')}
        >
          ← Back to Inbox
        </button>
        <ChatPanel productId={productId} otherUserId={otherUserId} />
      </div>
    </div>
  );
}
