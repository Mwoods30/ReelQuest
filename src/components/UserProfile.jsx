import { useState } from 'react';
import PropTypes from 'prop-types';
import { signOutUser, resetPassword } from '../firebase/auth.js';
import { updateUserProfile } from '../firebase/database.js';
import { useUser } from '../hooks/useUser.js';
import './UserProfile.css';

function UserProfile({ onClose }) {
  const { user, userProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [playerName, setPlayerName] = useState(userProfile?.playerName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSaveProfile = async () => {
    if (!user || !playerName.trim()) {
      setError('Player name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await updateUserProfile(user.uid, {
        playerName: playerName.trim()
      });

      if (result.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch {
      setError('An error occurred while updating your profile');
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      setError('No email associated with this account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await resetPassword(user.email);
      if (result.success) {
        setMessage('Password reset email sent! Check your inbox.');
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch {
      setError('An error occurred while sending reset email');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      onClose();
    } catch {
      setError('Failed to sign out');
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatPlayTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!user || !userProfile) {
    return (
      <div className="profile-overlay">
        <div className="profile-container">
          <div className="profile-header">
            <h2>User Profile</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="profile-content">
            <p>Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-overlay">
      <div className="profile-container">
        <div className="profile-header">
          <h2>🎣 Player Profile</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          {/* Basic Info Section */}
          <div className="profile-section">
            <h3>👤 Basic Information</h3>
            <div className="profile-field">
              <label>Player Name:</label>
              {isEditing ? (
                <div className="edit-field">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    disabled={loading}
                    maxLength={20}
                  />
                  <div className="edit-buttons">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={loading}
                      className="save-button"
                    >
                      {loading ? '💾 Saving...' : '💾 Save'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setPlayerName(userProfile.playerName || '');
                        setError('');
                      }}
                      disabled={loading}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="display-field">
                  <span>{userProfile.playerName}</span>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="edit-button"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            <div className="profile-field">
              <label>Member Since:</label>
              <span>{formatDate(userProfile.createdAt)}</span>
            </div>
          </div>

          {/* Game Statistics */}
          <div className="profile-section">
            <h3>📊 Game Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Level</span>
                <span className="stat-value">{userProfile.level || 1}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">XP</span>
                <span className="stat-value">{userProfile.xp || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Currency</span>
                <span className="stat-value">💰 {userProfile.currency || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Games Played</span>
                <span className="stat-value">{userProfile.gamesPlayed || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Catches</span>
                <span className="stat-value">{userProfile.totalCatches || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fish Sold</span>
                <span className="stat-value">{userProfile.totalFishSold || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Play Time</span>
                <span className="stat-value">{formatPlayTime(userProfile.totalPlayTime || 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Achievements</span>
                <span className="stat-value">{userProfile.achievements?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="profile-section">
            <h3>⚙️ Account Settings</h3>
            <div className="action-buttons">
              <button 
                onClick={handleResetPassword}
                disabled={loading}
                className="action-button password-button"
              >
                🔒 Reset Password
              </button>
              <button 
                onClick={handleSignOut}
                disabled={loading}
                className="action-button signout-button"
              >
                {loading ? '🚪 Signing out...' : '🚪 Sign Out'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
        </div>
      </div>
    </div>
  );
}

UserProfile.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default UserProfile;