import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  createAccount,
  signInUser,
  signInWithGoogle,
  resetPassword
} from '../firebase/auth.js';
import './AuthForm.css';

const HIGHLIGHTS = [
  { icon: '💾', text: 'Save every catch, coin, and upgrade' },
  { icon: '🏆', text: 'Compete on the live leaderboard' },
  { icon: '🌊', text: 'Sync progress across every device' }
];

function AuthForm({ onAuthSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const clearMessages = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      let result;

      if (isLogin) {
        result = await signInUser(email, password);
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        result = await createAccount(email, password, displayName);
      }

      result?.success
        ? onAuthSuccess(result.user)
        : setError(result?.error || 'Authentication failed');
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearMessages();

    try {
      const result = await signInWithGoogle();

      result?.success
        ? onAuthSuccess(result.user)
        : setError(result?.error || 'Google sign-in failed');
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result = await resetPassword(email);

      result?.success
        ? setMessage('Password reset email sent! Check your inbox.')
        : setError(result?.error || 'Failed to send reset email');
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearMessages();
    setPassword('');
  };

  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to ReelQuest"
    >
      <div className="auth-panel">

        {onClose && (
          <button
            type="button"
            className="auth-close-button"
            onClick={onClose}
            aria-label="Close sign in"
          >
            ×
          </button>
        )}

        {/* BRANDING SIDE */}
        <div className="auth-brand-panel">
          <div className="auth-brand-intro">
            <div className="auth-brand-logo">
              <img src="/Reelquest.png" alt="ReelQuest logo" loading="lazy" />
              <h1>ReelQuest</h1>
              <p>Cast, compete, and climb with your progress saved in the cloud.</p>
            </div>

            <ul className="auth-highlight-list">
              {HIGHLIGHTS.map((item) => (
                <li key={item.text}>
                  <span className="highlight-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-brand-footer">
            <span>🎣 Ready when you are.</span>
            <span>🌅 Keep your adventure flowing.</span>
          </div>
        </div>

        {/* FORM SIDE */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">

            <div className="auth-header">
              <h2>{isLogin ? 'Welcome Back!' : 'Join the Crew'}</h2>
              <p>
                {isLogin
                  ? 'Sign in to keep every catch and upgrade.'
                  : 'Create an account to track achievements anywhere.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* DISPLAY NAME (ONLY FOR SIGNUP) */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="displayName">Fisher Name</label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Choose your deck name"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {/* EMAIL */}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="angler@example.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* ERRORS + SUCCESS */}
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading
                  ? '⏳ Processing...'
                  : isLogin
                  ? '🎣 Sign In'
                  : '🌟 Create Account'}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="auth-divider">
              <span>or cast with</span>
            </div>

            {/* GOOGLE LOGIN */}
            <button
              type="button"
              className="google-sign-in-button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google logo"
                width="20"
                height="20"
              />
              Continue with Google
            </button>

            {/* FORGOT PASSWORD */}
            {isLogin && (
              <button
                type="button"
                className="forgot-password-button"
                onClick={handlePasswordReset}
                disabled={loading}
              >
                Forgot Password?
              </button>
            )}

            {/* TOGGLE LOGIN <-> SIGNUP */}
            <div className="auth-toggle">
              {isLogin ? (
                <>
                  New to ReelQuest?{' '}
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={toggleMode}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={toggleMode}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>

            {/* GUEST MODE NOTICE */}
            <div className="guest-play">
              <p className="guest-note">
                You can keep playing as a guest and sign in later.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

AuthForm.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func
};

export default AuthForm;
