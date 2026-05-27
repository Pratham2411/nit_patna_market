import { Link } from 'react-router-dom';

// OTP/email verification has been removed from the authentication flow.
// This page is kept only to avoid route-breaking if a user still has an old link.
export default function VerifyEmail() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">✓</div>
          <h1>Email verification disabled</h1>
          <p>
            Signup and login now work using email + password only. Please log in to continue.
          </p>
        </div>

        <Link to="/login" className="btn btn-primary btn-full btn-lg">
          Go to login
        </Link>

        <div className="auth-footer">
          New here?{' '}
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
