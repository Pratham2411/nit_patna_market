import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Enter the OTP sent to your NITP email.');

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
      setMessage(getApiErrorMessage(err, 'OTP verification failed. Please try again.'));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">{status === 'success' ? 'OK' : 'OTP'}</div>
          <h1>{status === 'success' ? 'Email verified' : 'Verify email'}</h1>
          <p>{message}</p>
        </div>

        {status === 'success' ? (
          <Link to="/login" className="btn btn-primary btn-full btn-lg">Go to login</Link>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="verify-email">Email</label>
              <input
                id="verify-email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nitp.ac.in"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="verify-code">OTP</label>
              <input
                id="verify-code"
                className="form-input"
                inputMode="numeric"
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
              {status === 'loading' ? <><span className="spinner" /> Verifying...</> : 'Verify OTP'}
            </button>
          </form>
        )}

        {status !== 'success' && (
          <div className="auth-footer">
            Need a new OTP? Submit signup again with the same email.
          </div>
        )}
      </div>
    </div>
  );
}
