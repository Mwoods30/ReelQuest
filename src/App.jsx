
import React, { useState } from 'react';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const HomeScreen = () => (
    <div className="container">
      <div className="scroll-content">
        <div className="logo-section">
          <div className="logo-container">
            <img src="/Reelquest.png" alt="ReelQuest - Fishing Rod and Fish Logo" />
          </div>
        </div>
        <div className="title-section">
        
        <h1 className="title">ReelQuest </h1>
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
      </div>
      {renderBottomTabs()}
    </div>
  );

  const GameScreen = () => (
    <div className="container">
      <div className="game-container">
        <p className="game-text">
          🎮 <span className="brand-accent">Fishing Game</span> Coming Soon...
          <br /><br />
          Your <span className="brand-accent-green">fishing adventure</span> awaits!
          <br /><br />
          (Interactive game will load here)
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
        className={`tab ${currentScreen === 'leaderboard' ? 'active-tab' : ''}`}
        onClick={() => setCurrentScreen('leaderboard')}
      >
        <span className={`tab-icon ${currentScreen === 'leaderboard' ? 'active-tab-icon' : ''}`}>💯</span>
        <span className={`tab-label ${currentScreen === 'leaderboard' ? 'active-tab-label' : ''}`}>Scores</span>
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
      case 'leaderboard': return <LeaderboardScreen />;
      case 'about': return <AboutScreen />;
      default: return <HomeScreen />;
    }
  };

  return renderCurrentScreen();
}

export default App;
