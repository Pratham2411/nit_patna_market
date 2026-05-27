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

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailLower = form.email.trim().toLowerCase();
  const pwdIssues = passwordRules(form.password);

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
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: emailLower,
        password: form.password,
      });

      // Signup returns token for allowed users.
      if (data.token && data.user) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Registration failed. Try again.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Try again.'));
    } finally {
      setLoading(false);
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
                <span className="spinner" /> Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
