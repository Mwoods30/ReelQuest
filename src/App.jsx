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
            <img src="/Reelquest.png" alt="ReelQuest - Fishing Rod and Fish Logo" loading="lazy" />
          </div>
        </div>
        <div className="title-section">
          <h1 className="title">ReelQuest</h1>
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
          Welcome to <span className="brand-accent">ReelQuest</span>, one most immersive fishing experience on the web!
          <br />Cast your line, catch <span className="brand-accent-green">rare fish</span>, and climb the leaderboard.
          <br />Built with React and modern web technologies.
        </p>
        
        <div className="features-container">
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
          Play Now
        </button>
        
        {!isAuthenticated && (
          <button 
            className="auth-button"
            onClick={() => setShowAuth(true)}
          >
            Sign In / Register
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
        <h1 className="title">About ReelQuest</h1>
        <div className="about-container">
          <p className="about-text">
            <span className="brand-accent">ReelQuest</span> is a fast-paced, 60-second fishing challenge built for the web. Cast, reel, and climb the leaderboard while leveling up your fisher through events, quests, and collectibles.
          </p>

          <div className="about-section">
            <h3>Gameplay Loop</h3>
            <ul>
              <li>Cast and reel to land fish before the meter drains—streaks boost your score.</li>
              <li>Runs last 60 seconds; every catch can tip the leaderboard.</li>
              <li>Ghost races: pick a leaderboard run and race its pace bar live.</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Events & Competition</h3>
            <ul>
              <li>Rotating tournaments with special rules and bonuses (Rare Rush, Streak Madness, more).</li>
              <li>Global leaderboard with filters for Top Score, Catches, Streaks, Level, Recent.</li>
              <li>Race ghosts to benchmark yourself against top runs.</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Progression & Economy</h3>
            <ul>
              <li>Daily/weekly quests for coins and skill points; daily contracts to deliver fish for payouts.</li>
              <li>Shop with environments and upgrades; sell inventory to fund purchases.</li>
              <li>Skills boost reel power, escape reduction, rare chance, and XP gains.</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Collection & Cosmetics</h3>
            <ul>
              <li>Fish Compendium tracks every species, catch counts, and best sizes.</li>
              <li>Cosmetic skins re-theme the waters; pick your vibe without pay-to-win.</li>
              <li>Achievements, stats, and player profile keep long-term progress visible.</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Platform & Tech</h3>
            <ul>
              <li>Built with <span className="brand-accent">React</span> and modern web tooling for desktop and mobile.</li>
              <li>Realtime-friendly leaderboard and persistence (sign in to sync across devices).</li>
              <li>Responsive navigation with quick access to Play, Home, About, and Profile.</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Team</h3>
            <p className="about-text">
              <strong>Developed by:</strong> <span className="brand-accent">Matthew Woods</span>, <span className="brand-accent-green">Ryan McKearnin</span>, <span className="brand-accent">Tyler Klimczak</span>, <span className="brand-accent-green">Willow Iloka</span>
            </p>
          </div>

          <p className="about-text">
            Ready to fish? Jump into the Play tab, claim your quests, and set a new tournament record.
          </p>

          <div className="about-section">
            <h3>Trademark & Credits</h3>
            <p className="about-text">
              ReelQuest (TM) and the ReelQuest logo are trademarks of the ReelQuest team. All other trademarks, logos, and brands are the property of their respective owners.
            </p>
            <p className="about-copyright-text">
              © 2025 ReelQuest . All rights reserved.
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
