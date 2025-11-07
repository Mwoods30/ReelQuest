import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { signOutUser, resetPassword } from '../firebase/auth.js';
import { updateUserProfile } from '../firebase/database.js';
import { useUser } from '../hooks/useUser.js';
import './UserProfile.css';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

const formatPlayTime = (minutes) => {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

function UserProfile({ onClose }) {
  const { user, userProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [playerName, setPlayerName] = useState(userProfile?.playerName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const heroStats = useMemo(() => ([
    {
      label: 'Level',
      value: userProfile?.level ?? 1,
      accent: 'emerald'
    },
    {
      label: 'XP',
      value: userProfile?.xp ?? 0,
      accent: 'sky'
    },
    {
      label: 'Currency',
      value: `💰 ${userProfile?.currency ?? 0}`,
      accent: 'amber'
    }
  ]), [userProfile]);

  const profileStats = useMemo(() => ([
    { label: 'Games Played', value: userProfile?.gamesPlayed ?? 0 },
    { label: 'Total Catches', value: userProfile?.totalCatches ?? 0 },
    { label: 'Fish Sold', value: userProfile?.totalFishSold ?? 0 },
    { label: 'Play Time', value: formatPlayTime(userProfile?.totalPlayTime ?? 0) },
    { label: 'Achievements', value: userProfile?.achievements?.length ?? 0 },
    { label: 'Last Active', value: formatDate(userProfile?.lastActive) },
  ]), [userProfile]);

  const getPlayerInitials = (name, email) => {
    const source = name || email || 'P';
    return source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'P';
  };

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

  if (!user || !userProfile) {
    return (
      <div className="profile-overlay">
        <div className="profile-container">
          <div className="profile-hero">
            <button className="close-button" onClick={onClose} aria-label="Close profile">×</button>
            <div className="profile-identity">
              <div className="profile-avatar" aria-hidden="true">RQ</div>
              <div className="identity-meta">
                <span className="identity-label">Adventurer</span>
                <h2>Sign in to continue</h2>
                <span className="identity-email">Your progress awaits.</span>
              </div>
            </div>
          </div>
          <div className="profile-content empty-state">
            <p>Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-overlay">
      <div className="profile-container">
        <div className="profile-hero">
          <button className="close-button" onClick={onClose} aria-label="Close profile">×</button>
          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">
              {getPlayerInitials(userProfile.playerName, user.email)}
            </div>
            <div className="identity-meta">
              <span className="identity-label">Signed in as</span>
              <h2>{userProfile.playerName}</h2>
              <span className="identity-email">{user.email}</span>
              <div className="identity-dates">
                <span>Member since {formatDate(userProfile.createdAt)}</span>
                <span>Last played {formatDate(userProfile.lastActive)}</span>
              </div>
            </div>
          </div>
          <div className="profile-hero-stats">
            {heroStats.map(({ label, value, accent }) => (
              <div key={label} className={`hero-stat hero-stat-${accent}`}>
                <span className="hero-stat-label">{label}</span>
                <span className="hero-stat-value">{value}</span>
              </div>
            ))}
          </div>
          <div className="profile-hero-actions">
            <button className="return-home-button" type="button" onClick={onClose}>
              ⬅️ Back to Home
            </button>
          </div>
        </div>

        <div className="profile-content">
          <section className="profile-card">
            <header className="profile-card-header">
              <h3>Player Identity</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="chip-button"
                  type="button"
                >
                  ✏️ Edit name
                </button>
              )}
            </header>
            <div className="profile-fields">
              <div className="profile-field">
                <label>Display name</label>
                {isEditing ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      disabled={loading}
                      maxLength={20}
                      placeholder="Your fishing alias"
                    />
                    <div className="edit-buttons">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="save-button"
                        type="button"
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
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="field-value">{userProfile.playerName}</span>
                )}
              </div>
              <div className="profile-field">
                <label>Email</label>
                <span className="field-value">{user.email}</span>
              </div>
              <div className="profile-field">
                <label>Member since</label>
                <span className="field-value">{formatDate(userProfile.createdAt)}</span>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <header className="profile-card-header">
              <h3>Progress Overview</h3>
            </header>
            <div className="stats-grid">
              {profileStats.map(({ label, value }) => (
                <div key={label} className="stat-item">
                  <span className="stat-label">{label}</span>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-card">
            <header className="profile-card-header">
              <h3>Account Actions</h3>
            </header>
            <div className="action-buttons">
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="action-button password-button"
                type="button"
              >
                🔒 Send password reset
              </button>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="action-button signout-button"
                type="button"
              >
                {loading ? '🚪 Signing out...' : '🚪 Sign out'}
              </button>
            </div>
          </section>

          <section className="profile-card">
            <header className="profile-card-header achievements-header">
              <h3>Achievements</h3>
              <span className="chip">{userProfile.achievements?.length ?? 0} unlocked</span>
            </header>
            {userProfile.achievements?.length ? (
              <div className="achievements-grid">
                {userProfile.achievements.map((achievementId) => (
                  <div key={achievementId} className="achievement-item unlocked">
                    <span className="achievement-icon">🏆</span>
                    <div className="achievement-meta">
                      <span className="achievement-title">{achievementId}</span>
                      <span className="achievement-description">This badge is yours forever.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-achievements">
                <span>Keep fishing to unlock your first badge.</span>
              </div>
            )}
          </section>

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