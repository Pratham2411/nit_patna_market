import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

const passwordRules = (p) => {
  const issues = [];
  if (p.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(p)) issues.push('one uppercase letter');
  if (!/[a-z]/.test(p)) issues.push('one lowercase letter');
  if (!/[0-9]/.test(p)) issues.push('one number');
  return issues;
};

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('signup'); // 'signup' | 'otp' | 'done'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const registeredEmail = form.email.trim().toLowerCase();
  const pwdIssues = passwordRules(form.password);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Step 1: submit signup form ──────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (pwdIssues.length) {
      setError(`Password needs: ${pwdIssues.join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: registeredEmail,
        password: form.password,
      });
      if (data.token && data.user) {
        // admin — instant login
        login(data.token, data.user);
        navigate('/');
        return;
      }
      setInfo(data.message || 'Check your email for the 6-digit code.');
      setDevCode(data.verificationCode || '');
      setStep('otp');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', {
        email: registeredEmail,
        code: otp.trim(),
      });
      setInfo(data.message || 'Email verified! You can now log in.');
      setStep('done');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend code ─────────────────────────────────────────────────────────
  const handleResend = async () => {
    setError('');
    setInfo('');
    setOtp('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: registeredEmail,
        password: form.password,
      });
      setInfo(data.message || 'A new code was sent to your email.');
      setDevCode(data.verificationCode || '');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not resend code. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const heading =
    step === 'done' ? 'All done!' : step === 'otp' ? 'Verify your email' : 'Create an account';
  const subtext =
    step === 'done'
      ? 'Your account is verified and ready.'
      : step === 'otp'
      ? `Enter the 6-digit code we sent to ${registeredEmail}`
      : 'Sign up with any valid email address';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">🛒</div>
          <h1>{heading}</h1>
          <p>{subtext}</p>
        </div>

        {/* ── Done ── */}
        {step === 'done' && (
          <>
            {info && <p className="form-success">{info}</p>}
            <Link to="/login" className="btn btn-primary btn-full btn-lg">
              Go to login
            </Link>
          </>
        )}

        {/* ── OTP step ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-otp">
                Verification code
              </label>
              <input
                id="reg-otp"
                className="form-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                autoFocus
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}
            {info && <p className="form-success">{info}</p>}
            {devCode && (
              <p className="social-hint" style={{ fontSize: '0.8rem', color: '#888' }}>
                Dev mode OTP: <strong>{devCode}</strong>
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || otp.length !== 6}
            >
              {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & activate account'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              style={{ marginTop: '0.6rem' }}
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? 'Sending…' : "Didn't get the code? Resend"}
            </button>
          </form>
        )}

        {/* ── Signup form ── */}
        {step === 'signup' && (
          <form id="register-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email address
              </label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                name="password"
                placeholder="Min. 8 chars, upper, lower, number"
                value={form.password}
                onChange={handleChange}
                required
              />
              {form.password && pwdIssues.length > 0 && (
                <p style={{ fontSize: '0.78rem', color: '#e07b00', marginTop: '4px' }}>
                  Needs: {pwdIssues.join(', ')}
                </p>
              )}
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create account'}
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <div className="auth-footer">
          {step === 'otp' ? (
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
              onClick={() => { setStep('signup'); setError(''); setInfo(''); setOtp(''); }}
            >
              ← Back to signup
            </button>
          ) : step === 'signup' ? (
            <>Already have an account? <Link to="/login">Log in</Link></>
          ) : null}
        </div>
      </div>
    </div>
  );
}
