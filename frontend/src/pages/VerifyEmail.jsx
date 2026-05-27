import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing a token.');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message || 'Email verified. You can now log in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(getApiErrorMessage(err, 'Verification failed. Please try signing up again.'));
      });
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">{status === 'loading' ? '...' : status === 'success' ? 'OK' : '!'}</div>
          <h1>{status === 'success' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Checking link'}</h1>
          <p>{message}</p>
        </div>

        {status === 'loading' ? (
          <div className="loader-page" style={{ minHeight: 80 }}><div className="spinner" /></div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-full btn-lg">Go to login</Link>
        )}
      </div>
    </div>
  );
}
