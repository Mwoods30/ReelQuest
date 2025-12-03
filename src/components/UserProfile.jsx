import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { signOutUser, resetPassword } from '../firebase/auth.js';
import { useUser } from '../hooks/useUser.js';
import { readPlayerData, readPlayerStats } from './fishing/storage.js';
import './UserProfile.css';

const ALL_ACHIEVEMENTS = [
  { id: 'first_catch', title: 'First Catch', description: 'Reel in your very first fish.', icon: '🎣' },
  { id: 'streak_master', title: 'Streak Master', description: 'Hit a streak of 5 catches without a miss.', icon: '⚡' },
  { id: 'silver_monger', title: 'Silver Monger', description: 'Sell 10 fish back-to-back.', icon: '💰' },
  { id: 'voyager', title: 'Voyager', description: 'Play in two different environments.', icon: '🧭' },
  { id: 'marathoner', title: 'Marathoner', description: 'Complete 10 game sessions.', icon: '🏁' },
  { id: 'wealth_builder', title: 'Wealth Builder', description: 'Accumulate 1,000 coins across runs.', icon: '💎' }
];

const formatDate = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

const formatPlayTime = (minutes = 0) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

function UserProfile({ onClose }) {
  const { user, userProfile } = useUser();
  const localData = useMemo(readPlayerData, [userProfile]);
  const localStats = useMemo(readPlayerStats, [userProfile]);

  const profile = userProfile ?? localData;
  const stats = userProfile ?? localStats;

  const [isEditing, setIsEditing] = useState(false);
  const [playerName, setPlayerName] = useState(profile?.playerName || '');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /** --------------------------- HERO STATS --------------------------- **/
  const heroStats = useMemo(() => [
    { label: 'Level', value: profile?.level ?? 1, accent: 'emerald' },
    { label: 'XP', value: profile?.xp ?? 0, accent: 'sky' },
    { label: 'Currency', value: `💰 ${profile?.currency ?? 0}`, accent: 'amber' }
  ], [profile]);

  /** ---------------------- ACHIEVEMENTS MERGING ---------------------- **/
  const achievementsWithStatus = useMemo(() => {
    const unlocked = new Set(userProfile?.achievements ?? []);

    const base = ALL_ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlocked.has(a.id)
    }));

    const legacy = [...unlocked]
      .filter(id => !ALL_ACHIEVEMENTS.some(a => a.id === id))
      .map(id => ({
        id,
        title: id,
        description: 'Unlocked during a special event.',
        icon: '🏅',
        unlocked: true,
        isLegacy: true
      }));

    return [...base, ...legacy];
  }, [userProfile]);

  const unlockedCount = useMemo(
    () => achievementsWithStatus.filter(a => a.unlocked).length,
    [achievementsWithStatus]
  );

  /** ------------------------ PROFILE SUMMARY STATS ------------------------ **/
  const profileStats = useMemo(() => [
    { label: 'Games Played', value: stats.gamesPlayed ?? 0 },
    { label: 'Total Catches', value: stats.totalCatches ?? 0 },
    { label: 'Fish Sold', value: stats.totalFishSold ?? 0 },
    { label: 'Play Time', value: formatPlayTime(stats.totalPlayTime ?? 0) },
    { label: 'Achievements', value: unlockedCount },
    { label: 'Last Active', value: formatDate(stats.lastActive ?? stats.lastPlayed) }
  ], [stats, unlockedCount]);

  /** ---------------------- UTIL: INITIALS FROM NAME ---------------------- **/
  const getInitials = (name, email) => {
    const source = name || email || 'P';
    return source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(x => x[0]?.toUpperCase() || '')
      .join('') || 'P';
  };

  /** --------------------- SAVE PROFILE NAME --------------------- **/
  const handleSaveProfile = async () => {
    if (!user || !playerName.trim()) {
      setError('Player name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { updateUserProfile } = await import('../firebase/database.js');
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

  /** --------------------- SEND RESET PASSWORD --------------------- **/
  const handleResetPassword = async () => {
    if (!user?.email) return setError('No email associated with this account');

    setLoading(true);
    setError('');

    try {
      const result = await resetPassword(user.email);
      result.success
        ? setMessage('Password reset email sent! Check your inbox.')
        : setError(result.error || 'Failed to send reset email');
    } catch {
      setError('An error occurred while sending reset email');
    }

    setLoading(false);
  };

  /** -------------------------- SIGN OUT -------------------------- **/
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

  /** -------------------------- GUEST MODE -------------------------- **/
  if (!user || !userProfile) {
    return (
      <div className="profile-overlay">
        <div className="profile-container">
          <div className="profile-hero">
            <button className="close-button" onClick={onClose} aria-label="Close profile">×</button>
            <div className="profile-identity">
              <div className="profile-avatar">RQ</div>
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

  /** --------------------------- FULL PROFILE UI --------------------------- **/
  return (
    <div className="profile-overlay">
      <div className="profile-container">

        {/* HEADER + HERO */}
        <div className="profile-hero">
          <button className="close-button" onClick={onClose} aria-label="Close profile">×</button>

          <div className="profile-identity">
            <div className="profile-avatar">
              {getInitials(profile.playerName, user.email)}
            </div>

            <div className="identity-meta">
              <span className="identity-label">Signed in as</span>
              <h2>{profile.playerName}</h2>
              <span className="identity-email">{user.email}</span>

              <div className="identity-dates">
                <span>Member since {formatDate(profile.createdAt)}</span>
                <span>Last played {formatDate(profile.lastActive)}</span>
              </div>
            </div>
          </div>

          <div className="profile-hero-stats">
            {heroStats.map(s => (
              <div key={s.label} className={`hero-stat hero-stat-${s.accent}`}>
                <span className="hero-stat-label">{s.label}</span>
                <span className="hero-stat-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PROFILE CONTENT */}
        <div className="profile-content">

          {/* --- PLAYER NAME CARD --- */}
          <section className="profile-card">
            <header className="profile-card-header">
              <h3>Player Identity</h3>

              {!isEditing && (
                <button className="chip-button" onClick={() => setIsEditing(true)} type="button">
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
                      maxLength={20}
                      disabled={loading}
                      placeholder="Your fishing alias"
                      onChange={(e) => setPlayerName(e.target.value)}
                    />

                    <div className="edit-buttons">
                      <button className="save-button" disabled={loading} onClick={handleSaveProfile}>
                        {loading ? '💾 Saving...' : '💾 Save'}
                      </button>
                      <button
                        className="cancel-button"
                        disabled={loading}
                        onClick={() => {
                          setIsEditing(false);
                          setPlayerName(profile.playerName);
                          setError('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="field-value">{profile.playerName}</span>
                )}
              </div>

              <div className="profile-field">
                <label>Email</label>
                <span className="field-value">{user.email}</span>
              </div>

              <div className="profile-field">
                <label>Fisherman since</label>
                <span className="field-value">{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </section>

          {/* --- STATS OVERVIEW --- */}
          <section className="profile-card">
            <header className="profile-card-header">
              <h3>Stats Overview</h3>
            </header>

            <div className="stats-grid">
              {profileStats.map(stat => (
                <div key={stat.label} className="stat-item">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* --- ACCOUNT ACTIONS --- */}
          <section className="profile-card">
            <header className="profile-card-header">
              <h3>Account Actions</h3>
            </header>

            <div className="action-buttons">
              <button
                className="action-button password-button"
                disabled={loading}
                onClick={handleResetPassword}
              >
                🔒 Send password reset
              </button>

              <button
                className="action-button signout-button"
                disabled={loading}
                onClick={handleSignOut}
              >
                {loading ? '🚪 Signing out...' : '🚪 Sign out'}
              </button>
            </div>
          </section>

          {/* --- ACHIEVEMENTS --- */}
          <section className="profile-card">
            <header className="profile-card-header achievements-header">
              <h3>Achievements</h3>
              <span className="chip">{unlockedCount}/{achievementsWithStatus.length} unlocked</span>
            </header>

            {achievementsWithStatus.length > 0 ? (
              <div className="achievements-grid">
                {achievementsWithStatus.map(ach => (
                  <div key={ach.id} className={`achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                    <span className="achievement-icon">
                      {ach.unlocked ? ach.icon : '🔒'}
                    </span>

                    <div className="achievement-meta">
                      <span className="achievement-title">
                        {ach.title}{ach.isLegacy ? ' (Legacy)' : ''}
                      </span>
                      <span className="achievement-description">{ach.description}</span>
                      <span className="achievement-status">
                        {ach.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
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
