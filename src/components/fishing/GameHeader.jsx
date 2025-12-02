import PropTypes from 'prop-types';
import { LEVEL_XP_REQUIREMENTS } from './constants.js';

const GameHeader = ({ score, playerData, timeDisplay, bestScore, activeEnvironment, returnToHome }) => (
  <header className="game-header">
    <div className="score-display">
      <span className="score-label">Score</span>
      <span className="score-value">{score}</span>
    </div>
    <div className="level-display">
      <span className="level-label">Level {playerData?.level || 1}</span>
      <div className="xp-bar">
        <div
          className="xp-fill"
          style={{
            width: `${Math.min(
              100,
              ((playerData?.xp || 0) /
                (LEVEL_XP_REQUIREMENTS[playerData?.level || 1] || (playerData?.xp || 0) + 1)) *
                100
            )}%`
          }}
        />
      </div>
      <span className="xp-text">
        {playerData?.xp || 0}/{LEVEL_XP_REQUIREMENTS[playerData?.level || 1] || 'Max'}
      </span>
    </div>
    <div className="currency-display">
      <span className="currency-label">💰</span>
      <span className="currency-value">{playerData.currency || 0}</span>
    </div>
    <div className="timer-display">
      <span className="timer-label">Time</span>
      <span className="timer-value">{timeDisplay}</span>
    </div>
    <div className="best-score-display">
      <span className="best-score-label">Best</span>
      <span className="best-score-value">{Math.max(bestScore, score)}</span>
    </div>
    <div className="environment-badge" title="Current environment">
      <span className="environment-emoji">{activeEnvironment.emoji || '🌊'}</span>
      <div className="environment-details">
        <span className="environment-label">Environment</span>
        <span className="environment-name">{activeEnvironment.name}</span>
      </div>
    </div>
    <div className="header-buttons">
      <button
        className="home-button-game"
        onClick={returnToHome}
        aria-label="Return to home"
        title="Return to home"
      >
        🏠
      </button>
    </div>
  </header>
);

GameHeader.propTypes = {
  score: PropTypes.number.isRequired,
  playerData: PropTypes.object.isRequired,
  timeDisplay: PropTypes.string.isRequired,
  bestScore: PropTypes.number.isRequired,
  activeEnvironment: PropTypes.object.isRequired,
  returnToHome: PropTypes.func.isRequired
};

export default GameHeader;
