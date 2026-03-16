import { useEffect, useRef, useState } from 'react';
import './App.css';
import FishingGame from './components/FishingGame.jsx';
import AuthForm from './components/AuthForm.jsx';
import UserProfile from './components/UserProfile.jsx';
import { UserProvider } from './contexts/UserContext.jsx';
import { useUser } from './hooks/useUser.js';
import { signOutUser } from './firebase/auth.js';

function AppContent() {
  const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [currentScreen, setCurrentScreen] = useState(() => (initialIsMobile ? 'game' : 'home'));
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const hasForcedMobileScreen = useRef(initialIsMobile);
  const { user, userProfile, loading, isAuthenticated, updateUserProfileCache } = useUser();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (isMobile && !hasForcedMobileScreen.current) {
      setCurrentScreen('game');
      hasForcedMobileScreen.current = true;
    }
  }, [isMobile, setCurrentScreen]);

  const handleSignOut = async () => {
    await signOutUser();
  };

  const renderNavigationTabs = (variant = 'standard') => {
    const classes = ['navigation-tabs', `navigation-tabs-${variant}`];
    if (isMobile) {
      classes.push('navigation-tabs-mobile');
    }

    const ariaLabel = variant === 'game' ? 'In-game navigation' : 'Main navigation';

    return (
      <nav className={classes.join(' ')} aria-label={ariaLabel}>
        <button
          type="button"
          className={`navigation-tab ${currentScreen === 'home' ? 'navigation-tab-active' : ''}`}
          onClick={() => {
            setShowProfile(false);
            setCurrentScreen('home');
          }}
        >
          <span className="navigation-tab-icon" aria-hidden="true">🏚️</span>
          <span className="navigation-tab-label">Home</span>
        </button>
        <button
          type="button"
          className={`navigation-tab ${currentScreen === 'game' ? 'navigation-tab-active' : ''}`}
          onClick={() => {
            setShowProfile(false);
            setCurrentScreen('game');
          }}
        >
          <span className="navigation-tab-icon" aria-hidden="true">🕹️</span>
          <span className="navigation-tab-label">Play</span>
        </button>
        <button
          type="button"
          className={`navigation-tab ${currentScreen === 'about' ? 'navigation-tab-active' : ''}`}
          onClick={() => {
            setShowProfile(false);
            setCurrentScreen('about');
          }}
        >
          <span className="navigation-tab-icon" aria-hidden="true">ℹ️</span>
          <span className="navigation-tab-label">About</span>
        </button>
        <button
          type="button"
          className={`navigation-tab navigation-tab-action ${showProfile ? 'navigation-tab-active' : ''}`}
          onClick={() => setShowProfile((prev) => !prev)}
          aria-pressed={showProfile}
        >
          <span className="navigation-tab-icon" aria-hidden="true">👤</span>
          <span className="navigation-tab-label">Profile</span>
        </button>
      </nav>
    );
  };

  const HomeScreen = () => (
    <div className={`container${isMobile ? ' container-mobile-home' : ''}`}>
      <div className="scroll-content">
        <div className="logo-section">
          <div className="logo-container">
            <img src="/Reelquest.png" alt="ReelQuest - Fishing Rod and Fish Logo" />
          </div>
        </div>
        <div className="title-section">
          <h1 className="title">ReelQuest</h1>
          <p className="subtitle">Cast. Reel. Conquer.</p>
        </div>

        <div className="hero-badges">
          <span className="hero-badge">⚡ 60 Second Rounds</span>
          <span className="hero-badge">🐟 14 Fish Species</span>
          <span className="hero-badge">🏆 Global Leaderboard</span>
        </div>

        {/* User Status Section */}
        <div className="user-status-section">
          {isAuthenticated ? (
            <div className="user-welcome">
              <p className="welcome-message">
                Welcome back, <span className="brand-accent">{userProfile?.playerName || 'Fisher'}</span>!
              </p>
              <div className="user-stats-mini">
                <span>Level {userProfile?.level || 1}</span>
                <span>💰 {userProfile?.currency || 0}</span>
              </div>
              <div className="user-actions">
                <button className="profile-button" onClick={() => setShowProfile(true)}>
                  👤 Profile
                </button>
                <button className="sign-out-button" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="guest-status">
              <p className="guest-message">
                Playing as guest - <button 
                  className="sign-in-link" 
                  onClick={() => setShowAuth(true)}
                >
                  Sign in
                </button> to save progress!
              </p>
            </div>
          )}
        </div>
        
        <p className="welcome-text">
          Welcome to <span className="brand-accent">ReelQuest</span>, the most immersive fishing experience on the web!
          <br />Cast your line, catch <span className="brand-accent-green">rare fish</span>, and climb the leaderboard.
          <br />Built with React and modern web technologies.
        </p>
        
        <div className="features-container features-grid">
          <div className="feature-item">
            <p className="feature-text">🎮 Play a realistic <span className="brand-accent">fishing game</span> in your browser</p>
          </div>
          <div className="feature-item">
            <p className="feature-text">🏆 Compete for <span className="brand-accent-green">high scores</span> on the leaderboard</p>
          </div>
          <div className="feature-item">
            <p className="feature-text">🐟 Discover and catch <span className="brand-accent-green">rare fish</span> species</p>
          </div>
          <div className="feature-item">
            <p className="feature-text">🧑‍💻 Built by <span className="brand-accent">passionate developers</span></p>
          </div>
        </div>

        <button 
          className="play-button"
          onClick={() => setCurrentScreen('game')}
        >
          🎣 Start Fishing
        </button>
        
        {!isAuthenticated && (
          <button 
            className="auth-button"
            onClick={() => setShowAuth(true)}
          >
            🌟 Sign In to Save Progress
          </button>
        )}
      </div>
      {renderNavigationTabs('standard')}
    </div>
  );

  const GameScreen = () => {
    const handleGameComplete = (gameResult) => {
      console.log('Game completed:', gameResult);
      // Hook for future post-game logic (achievements, analytics, etc.).
    };

    const overlayClasses = ['game-account-overlay'];
    if (isMobile) {
      overlayClasses.push('game-account-overlay-mobile');
    }

    return (
      <div className="full-game-screen">
        <FishingGame
          onGameComplete={handleGameComplete}
          user={user}
          userProfile={userProfile}
          isAuthenticated={isAuthenticated}
          onProfileCacheUpdate={updateUserProfileCache}
          renderNavigationTabs={renderNavigationTabs}
          isMobile={isMobile}
        />
      </div>
    );
  };



  const AboutScreen = () => (
    <div className={`container${isMobile ? ' container-mobile-about' : ''}`}>
      <div className="scroll-content">
        <div className="about-hero">
          <h1 className="title">About ReelQuest</h1>
          <p className="subtitle">Cast. Reel. Conquer.</p>
        </div>

        <div className="about-container">
          <p className="about-text about-lead">
            <span className="brand-accent">ReelQuest</span> is a fast-paced, 60-second fishing challenge built for the web. Cast your line, land rare fish, and climb the global leaderboard — all in your browser.
          </p>

          <div className="about-features-grid">
            <div className="about-feature-card">
              <span className="about-feature-icon">🎮</span>
              <h4>Gameplay</h4>
              <p>Cast and reel before the meter drains. Streaks multiply your score — keep the chain alive.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">🏆</span>
              <h4>Competition</h4>
              <p>Global leaderboard updated in real time. Race ghost replays of top runs to benchmark yourself.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">📈</span>
              <h4>Progression</h4>
              <p>Level up, unlock environments, and buy rod upgrades that change how the game plays.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">🐟</span>
              <h4>Collection</h4>
              <p>14 fish species across 4 rarity tiers — from common Bluegill to the legendary Abyss Leviathan.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">🌍</span>
              <h4>Environments</h4>
              <p>8 unlockable locations from Crystal Lake to Deep Sea, each with a unique visual theme.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">⚛️</span>
              <h4>Tech</h4>
              <p>Built with React 18, Firebase, and Vite. Cloud save syncs your progress across every device.</p>
            </div>
          </div>

          <div className="about-section about-team-section">
            <h3>👥 The Team</h3>
            <div className="team-grid">
              {[
                { name: 'Matthew Woods',  role: 'Developer', accent: 'sky' },
                { name: 'Ryan McKearnin', role: 'Developer', accent: 'emerald' },
                { name: 'Tyler Klimczak', role: 'Developer', accent: 'sky' },
                { name: 'Willow Iloka',   role: 'Developer', accent: 'emerald' },
              ].map(({ name, role, accent }) => (
                <div key={name} className={`team-card team-card-${accent}`}>
                  <div className="team-avatar">{name[0]}</div>
                  <div className="team-info">
                    <span className="team-name">{name}</span>
                    <span className="team-role">{role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="about-cta">
            <button className="play-button" onClick={() => setCurrentScreen('game')}>
              🎣 Start Fishing
            </button>
          </div>

          <div className="about-section">
            <p className="about-copyright-text">
              ReelQuest™ and the ReelQuest logo are trademarks of the ReelQuest team. © 2025 ReelQuest. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      {renderNavigationTabs('standard')}
    </div>
  );


  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'game': return <GameScreen />;
      case 'about': return <AboutScreen />;
      default: return <HomeScreen />;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <div className="loading-content">
            <h2>🎣 ReelQuest</h2>
            <p>Loading your fishing adventure...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderCurrentScreen()}
      {showAuth && (
        <AuthForm
          onAuthSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
