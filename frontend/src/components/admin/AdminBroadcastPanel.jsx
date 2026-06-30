import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Loader, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBroadcastPanel = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [failDetails, setFailDetails] = useState(null);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/broadcasts`, {
        withCredentials: true,
      });
      setBroadcasts(res.data);
    } catch (err) {
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      return toast.error('Subject and Message are required');
    }

    if (!window.confirm('Are you sure you want to send this email to ALL active users?')) {
      return;
    }

    setSending(true);
    setFailDetails(null);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/broadcasts`,
        formData,
        { withCredentials: true }
      );
      
      const newBroadcast = res.data;
      setBroadcasts([newBroadcast, ...broadcasts]);
      setFormData({ subject: '', message: '' });
      
      if (newBroadcast.failedCount > 0) {
        toast.success(`Broadcast sent, but ${newBroadcast.failedCount} failed.`);
        setFailDetails({
          success: newBroadcast.successCount,
          failed: newBroadcast.failedCount,
          total: newBroadcast.successCount + newBroadcast.failedCount,
          failures: newBroadcast.failures,
        });
      } else {
        toast.success('Broadcast sent successfully to all users!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compose Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Compose Broadcast
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Send an email to all active users on the platform
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {failDetails && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-800">
                    Partial Delivery Issue ({failDetails.success}/{failDetails.total} successful)
                  </h4>
                  <p className="text-xs text-orange-700 mt-1 mb-2">
                    Some users did not receive the email. See details below.
                  </p>
                  <div className="bg-white/60 rounded border border-orange-100 max-h-40 overflow-y-auto">
                    <ul className="text-xs text-slate-700 divide-y divide-orange-100">
                      {failDetails.failures.map((f, i) => (
                        <li key={i} className="py-2 px-3 flex justify-between gap-4">
                          <span className="font-medium text-slate-800 truncate">{f.email}</span>
                          <span className="text-orange-600 truncate" title={f.reason}>{f.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g., Important update about Campus Market"
              maxLength={120}
              required
            />
            <div className="text-right mt-1">
              <span className="text-xs text-slate-400">
                {formData.subject.length}/120
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              rows={6}
              placeholder="Write your email body here... (Plain text, HTML will be escaped)"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={sending || !formData.subject.trim() || !formData.message.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Broadcast History
          </h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Loader className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            Loading history...
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-slate-400" />
            </div>
            <p>No broadcast emails sent yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {broadcasts.map((b) => (
              <div key={b._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800">{b.subject}</h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-200">
                    {new Date(b.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap line-clamp-3">
                  {b.message}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {b.sentBy?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                    <span>Sent by {b.sentBy?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {b.successCount}
                    </span>
                    {b.failedCount > 0 && (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium" title="Some emails failed to send">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {b.failedCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBroadcastPanel;
