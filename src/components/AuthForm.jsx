import { useState } from 'react';
import PropTypes from 'prop-types';
import { createAccount, signInUser, signInWithGoogle, resetPassword } from '../firebase/auth.js';
import './AuthForm.css';

const highlightItems = [
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

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

      if (result.success) {
        onAuthSuccess(result.user);
      } else {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();

      if (result.success) {
        onAuthSuccess(result.user);
      } else {
        setError(result.error);
      }
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
    setError('');

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setMessage('Password reset email sent! Check your inbox.');
      } else {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin((value) => !value);
    setError('');
    setMessage('');
    setPassword('');
  };

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Sign in to ReelQuest">
      <div className="auth-panel">
        {onClose ? (
          <button
            type="button"
            className="auth-close-button"
            onClick={onClose}
            aria-label="Close sign in"
          >
            ×
          </button>
        ) : null}

        <div className="auth-brand-panel">
          <div className="auth-brand-intro">
            <div className="auth-brand-logo">
              <img src="/Reelquest.png" alt="ReelQuest logo" />
              <h1>ReelQuest</h1>
              <p>Cast, compete, and climb with your progress saved in the cloud.</p>
            </div>
            <ul className="auth-highlight-list">
              {highlightItems.map((item) => (
                <li key={item.text}>
                  <span className="highlight-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="auth-brand-footer">
            <span>🎣 Ready when you are.</span>
            <span>🌅 Keep your adventure flowing.</span>
          </div>
        </div>

        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>{isLogin ? 'Welcome Back, Angler!' : 'Join the Crew'}</h2>
              <p>{isLogin ? 'Sign in to keep every catch and upgrade.' : 'Create an account to track achievements anywhere.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="displayName">Fisher Name</label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Choose your deck name"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="angler@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {error ? <div className="error-message">{error}</div> : null}
              {message ? <div className="success-message">{message}</div> : null}

              <button type="submit" className="auth-submit-button" disabled={loading}>
                {loading ? '⏳ Processing...' : isLogin ? '🎣 Sign In' : '🌟 Create Account'}
              </button>
            </form>

            <div className="auth-divider">
              <span>or cast with</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="google-sign-in-button"
              disabled={loading}
              type="button"
            >
              <img 
  src="https://developers.google.com/identity/images/g-logo.png" 
  alt="Google logo" 
  width="20" 
  height="20"
/> Continue with Google
            </button>

            {isLogin ? (
              <button
                onClick={handlePasswordReset}
                className="forgot-password-button"
                disabled={loading}
                type="button"
              >
                Forgot Password?
              </button>
            ) : null}

            <div className="auth-toggle">
              {isLogin ? (
                <>
                  New to ReelQuest?{' '}
                  <button onClick={toggleMode} className="toggle-button" type="button">
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={toggleMode} className="toggle-button" type="button">
                    Sign In
                  </button>
                </>
              )}
            </div>

            <div className="guest-play">
              <p className="guest-note">You can keep playing as a guest and sign in later.</p>
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
