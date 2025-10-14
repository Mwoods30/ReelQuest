
import React, { useState } from 'react';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const HomeScreen = () => (
    <div className="container">
      <div className="scroll-content">
        <h1 className="title">ReelQuest Fishing</h1>
        <p className="welcome-text">
          Welcome to ReelQuest, the most immersive fishing experience on the web!
          <br />Cast your line, catch rare fish, and climb the leaderboard.
          <br />Built with React and modern web technologies.
        </p>
        
        <div className="features-container">
          <div className="feature-item">
            <p className="feature-text">🎮 Play a realistic fishing game in your browser</p>
          </div>
          <div className="feature-item">
            <p className="feature-text">🏆 Compete for high scores on the leaderboard</p>
          </div>
          <div className="feature-item">
            <p className="feature-text">🐟 Discover and catch rare fish</p>
          </div>
          <div className="feature-item">
            <p className="feature-text">🧑‍💻 Built by passionate developers</p>
          </div>
        </div>

        <button 
          className="play-button"
          onClick={() => setCurrentScreen('game')}
        >
          Play Now
        </button>
      </div>
      {renderBottomTabs()}
    </div>
  );

  const GameScreen = () => (
    <div className="container">
      <div className="game-container">
        <p className="game-text">
          🎮 Fishing Game Coming Soon...
          <br /><br />
          Your fishing adventure awaits!
          <br /><br />
          (WebGL game will load here)
        </p>
      </div>
      {renderBottomTabs()}
    </div>
  );

  const LeaderboardScreen = () => (
    <div className="container">
      <div className="scroll-content">
        <h1 className="title">Leaderboard</h1>
        <div className="leaderboard-container">
          <p className="no-scores-text">No scores yet. Start playing to see your results!</p>
        </div>
      </div>
      {renderBottomTabs()}
    </div>
  );

  const AboutScreen = () => (
    <div className="container">
      <div className="scroll-content">
        <h1 className="title">About</h1>
        <div className="about-container">
          <p className="about-text">
            ReelQuest is a modern web-based fishing game. Cast your line, catch rare fish, and compete for the top score!
          </p>
          <p className="about-text">
            Developed by: Matthew Woods, Ryan McKearnin, Tyler Klimczak, Willow Iloka
          </p>
          <p className="about-text">
            Built with React and modern web technologies.
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
        <span className={`tab-icon ${currentScreen === 'home' ? 'active-tab-icon' : ''}`}>🏠</span>
        <span className={`tab-label ${currentScreen === 'home' ? 'active-tab-label' : ''}`}>Home</span>
      </button>
      
      <button 
        className={`tab ${currentScreen === 'game' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('game')}
      >
        <span className={`tab-icon ${currentScreen === 'game' ? 'active-tab-icon' : ''}`}>🎮</span>
        <span className={`tab-label ${currentScreen === 'game' ? 'active-tab-label' : ''}`}>Play</span>
      </button>
      
      <button 
        className={`tab ${currentScreen === 'leaderboard' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('leaderboard')}
      >
        <span className={`tab-icon ${currentScreen === 'leaderboard' ? 'active-tab-icon' : ''}`}>🏆</span>
        <span className={`tab-label ${currentScreen === 'leaderboard' ? 'active-tab-label' : ''}`}>Scores</span>
      </button>
      
      <button 
        className={`tab ${currentScreen === 'about' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('about')}
      >
        <span className={`tab-icon ${currentScreen === 'about' ? 'active-tab-icon' : ''}`}>ℹ️</span>
        <span className={`tab-label ${currentScreen === 'about' ? 'active-tab-label' : ''}`}>About</span>
      </button>
    </div>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'game': return <GameScreen />;
      case 'leaderboard': return <LeaderboardScreen />;
      case 'about': return <AboutScreen />;
      default: return <HomeScreen />;
    }
  };

  return renderCurrentScreen();
}

export default App;
