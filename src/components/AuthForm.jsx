import { useState } from 'react';
import PropTypes from 'prop-types';
import { createAccount, signInUser, signInWithGoogle, resetPassword } from '../firebase/auth.js';
import './AuthForm.css';

function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    
    const result = await signInWithGoogle();
    
    if (result.success) {
      onAuthSuccess(result.user);
    } else {
      setError(result.error);
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
    
    const result = await resetPassword(email);
    
    if (result.success) {
      setMessage('Password reset email sent! Check your inbox.');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setMessage('');
    setPassword('');
  };

  return (
    <div className="auth-overlay">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>🎣 {isLogin ? 'Welcome Back!' : 'Join ReelQuest'}</h2>
          <p>{isLogin ? 'Sign in to save your progress' : 'Create an account to track your achievements'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Fisher Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your fisher name"
                required={!isLogin}
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? '⏳ Processing...' : isLogin ? '🎣 Sign In' : '🌟 Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="google-sign-in-button"
          disabled={loading}
        >
          🔍 Continue with Google
        </button>

        {isLogin && (
          <button 
            onClick={handlePasswordReset}
            className="forgot-password-button"
            disabled={loading}
          >
            Forgot Password?
          </button>
        )}

        <div className="auth-toggle">
          {isLogin ? (
            <>
              New to ReelQuest?{' '}
              <button onClick={toggleMode} className="toggle-button">
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={toggleMode} className="toggle-button">
                Sign In
              </button>
            </>
          )}
        </div>

        <div className="guest-play">
          <p className="guest-note">
            <em>Note: Playing as a guest means your progress won&apos;t be saved!</em>
          </p>
        </div>
      </div>
    </div>
  );
}

AuthForm.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired
};

export default AuthForm;