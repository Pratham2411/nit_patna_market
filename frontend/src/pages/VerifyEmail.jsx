import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const { data } = await api.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      setStatus('success');
      setMessage(data.message || 'Email verified. You can now log in.');
    } catch (err) {
      setStatus('error');
      setMessage(getApiErrorMessage(err, 'Verification failed. Please try again.'));
    }
  };

  const handleResend = async () => {
    setMessage('');
    setStatus('idle');
    setCode('');
    // Trigger a new OTP by hitting register again — backend resends if unverified
    // User needs to go to register page for resend since we don't store password here
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">{status === 'success' ? '✓' : '✉'}</div>
          <h1>{status === 'success' ? 'Email verified!' : 'Verify your email'}</h1>
          <p>
            {status === 'success'
              ? 'Your account is now active.'
              : 'Enter the 6-digit code we sent to your inbox.'}
          </p>
        </div>

        {status === 'success' ? (
          <Link to="/login" className="btn btn-primary btn-full btn-lg">
            Go to login
          </Link>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="verify-email-input">Email address</label>
              <input
                id="verify-email-input"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="verify-code">Verification code</label>
              <input
                id="verify-code"
                className="form-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                required
              />
            </div>

            {status === 'error' && <p className="form-error">{message}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={status === 'loading' || code.length !== 6}
            >
              {status === 'loading' ? <><span className="spinner" /> Verifying…</> : 'Verify email'}
            </button>
          </form>
        )}

        {status !== 'success' && (
          <div className="auth-footer">
            Code expired?{' '}
            <Link to="/register">Sign up again</Link> to get a new one.
          </div>
        )}
      </div>
    </div>
  );
}
