import { useState } from 'react';
import './App.css';
import FishingGame from './components/FishingGame.jsx';
import AuthForm from './components/AuthForm.jsx';
import UserProfile from './components/UserProfile.jsx';
import { UserProvider } from './contexts/UserContext.jsx';
import { useUser } from './hooks/useUser.js';
import { signOutUser } from './firebase/auth.js';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, userProfile, loading, isAuthenticated } = useUser();

  const handleSignOut = async () => {
    await signOutUser();
  };

  const HomeScreen = () => (
    <div className="container">
      <div className="scroll-content">
        <div className="logo-section">
          <div className="logo-container">
            <img src="/Reelquest.png" alt="ReelQuest - Fishing Rod and Fish Logo" />
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
          Welcome to <span className="brand-accent">ReelQuest</span>, the most immersive fishing experience on the web!
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
      {renderBottomTabs()}
    </div>
  );

  const GameScreen = () => {
    const handleGameComplete = (gameResult) => {
      console.log('Game completed:', gameResult);
      // Here you could update user stats, show achievements, etc.
    };

    return (
      <div className="container play-container">
        {renderTopTabs()}
        <div className="play-content">
          <div className="play-header">
            <h1 className="title">Play ReelQuest</h1>
            <p className="play-subtitle">Cast your line and race the clock. Catch as many fish as you can in 60 seconds!</p>
            {isAuthenticated && userProfile && (
              <div className="player-info-header">
                <span>{userProfile.playerName} - Level {userProfile.level}</span>
                <span>💰 {userProfile.currency}</span>
              </div>
            )}
          </div>
          <div className="game-container">
            <FishingGame 
              onGameComplete={handleGameComplete}
              user={user}
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>
    );
  };



  const AboutScreen = () => (
    <div className="container">
      <div className="scroll-content">
        <h1 className="title">About</h1>
        <div className="about-container">
          <p className="about-text">
            <span className="brand-accent">ReelQuest</span> is a modern web-based fishing game. Cast your line, catch <span className="brand-accent-green">rare fish</span>, and compete for the top score!
          </p>
          <p className="about-text">
            <strong>Developed by:</strong> <span className="brand-accent">Matthew Woods</span>, <span className="brand-accent-green">Ryan McKearnin</span>, <span className="brand-accent">Tyler Klimczak</span>, <span className="brand-accent-green">Willow Iloka</span>
          </p>
          <p className="about-text">
            Built with <span className="brand-accent">React</span> and modern web technologies.
          </p>
        </div>
      </div>
      {renderBottomTabs()}
    </div>
  );

  const renderBottomTabs = () => (
    <div className="tab-bar">
      <button 
        className={`tab ${currentScreen === 'home' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('home')}
      >
        <span className={`tab-icon ${currentScreen === 'home' ? 'active-tab-icon' : ''}`}>🏚️</span>
        <span className={`tab-label ${currentScreen === 'home' ? 'active-tab-label' : ''}`}>Home</span>
      </button>
      
      <button 
        className={`tab ${currentScreen === 'game' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('game')}
      >
        <span className={`tab-icon ${currentScreen === 'game' ? 'active-tab-icon' : ''}`}>🕹️</span>
        <span className={`tab-label ${currentScreen === 'game' ? 'active-tab-label' : ''}`}>Play</span>
      </button>
      
      
      <button 
        className={`tab ${currentScreen === 'about' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('about')}
      >
        <span className={`tab-icon ${currentScreen === 'about' ? 'active-tab-icon' : ''}`}>𝍕</span>
        <span className={`tab-label ${currentScreen === 'about' ? 'active-tab-label' : ''}`}>About</span>
      </button>
    </div>
  );

  const renderTopTabs = () => (
    <div className="tab-bar tab-bar-top">
      <button 
        className={`tab ${currentScreen === 'home' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('home')}
      >
        <span className={`tab-icon ${currentScreen === 'home' ? 'active-tab-icon' : ''}`}>🏚️</span>
        <span className={`tab-label ${currentScreen === 'home' ? 'active-tab-label' : ''}`}>Home</span>
      </button>
      
      <button 
        className={`tab ${currentScreen === 'game' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('game')}
      >
        <span className={`tab-icon ${currentScreen === 'game' ? 'active-tab-icon' : ''}`}>🕹️</span>
        <span className={`tab-label ${currentScreen === 'game' ? 'active-tab-label' : ''}`}>Play</span>
      </button>
      
      
      <button 
        className={`tab ${currentScreen === 'about' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('about')}
      >
        <span className={`tab-icon ${currentScreen === 'about' ? 'active-tab-icon' : ''}`}>𝍕</span>
        <span className={`tab-label ${currentScreen === 'about' ? 'active-tab-label' : ''}`}>About</span>
      </button>
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
        <AuthForm onAuthSuccess={() => setShowAuth(false)} />
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
