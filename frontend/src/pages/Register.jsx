import { useState, useEffect } from 'react';
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

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const emailLower = form.email.trim().toLowerCase();
  const pwdIssues = passwordRules(form.password);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0 && step === 'otp') {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown, step]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pwdIssues.length) {
      setError(`Password needs: ${pwdIssues.join(', ')}`);
      return;
    }

    if (!emailLower) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', {
        name: form.name.trim(),
        email: emailLower,
        password: form.password,
      });

      setStep('otp');
      setResendCooldown(60);
      setError('');
      setForm((prev) => ({ ...prev, password: '' })); // Clear password state for security
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/verify-otp', {
        email: emailLower,
        otp,
      });

      if (data.token && data.user) {
        login(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid OTP. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setResending(true);
    
    try {
      await api.post('/auth/register/resend-otp', { email: emailLower });
      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend OTP.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">🎓</div>
          <h1>Join Campus Marketplace</h1>
          <p>Students/admins only — register with your college email</p>
        </div>

        {step === 'form' ? (
          <form id="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name
              </label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@nitp.ac.in"
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
                placeholder="Min. 8 characters, upper, lower, number"
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
              {loading ? (
                <>
                  <span className="spinner" /> Sending OTP…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        ) : (
          <div className="otp-screen">
            <p className="otp-email">Enter the code sent to<br/>{emailLower}</p>
            
            <form onSubmit={handleVerifyOtp}>
              <input
                className="otp-input"
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
              
              {error && <p className="form-error" style={{marginBottom: '16px'}}>{error}</p>}
              
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Verifying…
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
            
            <div className="otp-actions">
              <button
                type="button"
                className="otp-resend"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending}
              >
                {resending ? 'Sending...' : 
                 resendCooldown > 0 ? (
                  <>Resend available in <span className="otp-timer">{resendCooldown}s</span></>
                 ) : (
                  'Resend OTP'
                 )}
              </button>
              
              <button
                type="button"
                className="back-link"
                onClick={() => { setStep('form'); setError(''); }}
              >
                ← Back to sign up
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
