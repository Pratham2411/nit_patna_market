import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSuccess(data.message);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send reset code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (step === STEPS.OTP) {
      if (!otp.trim() || otp.trim().length !== 6) {
        setError('Please enter the 6-digit code.');
        return;
      }
      setStep(STEPS.PASSWORD);
      return;
    }

    // STEPS.PASSWORD
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(data.message);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password.'));
      // If OTP was invalid, go back to OTP step
      if (err.response?.status === 400 && err.response?.data?.message?.toLowerCase().includes('code')) {
        setStep(STEPS.OTP);
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSuccess('A new code has been sent to your email.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">
            <img src="/nitp-logo.png" alt="NIT Patna Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1>
            {step === STEPS.DONE ? 'All done!' : 'Reset password'}
          </h1>
          <p>
            {step === STEPS.EMAIL && 'Enter your email to receive a reset code'}
            {step === STEPS.OTP && 'Enter the 6-digit code sent to your email'}
            {step === STEPS.PASSWORD && 'Choose a new password'}
            {step === STEPS.DONE && 'Your password has been reset successfully'}
          </p>
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        {/* Step 1: Email */}
        {step === STEPS.EMAIL && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                className="form-input"
                type="email"
                placeholder="you@nitp.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Sending…</> : 'Send reset code'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === STEPS.OTP && (
          <form onSubmit={handleVerifyAndReset}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">6-digit code</label>
              <input
                id="reset-otp"
                className="form-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              Verify code
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResend}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              >
                {loading ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === STEPS.PASSWORD && (
          <form onSubmit={handleVerifyAndReset}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-pw">New password</label>
              <input
                id="reset-new-pw"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
                minLength={8}
              />
              <span className="form-hint" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number
              </span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-pw">Confirm password</label>
              <input
                id="reset-confirm-pw"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Resetting…</> : 'Reset password'}
            </button>
          </form>
        )}

        {/* Step 4: Done */}
        {step === STEPS.DONE && (
          <button
            type="button"
            className="btn btn-primary btn-full btn-lg"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        )}

        <div className="auth-footer">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
