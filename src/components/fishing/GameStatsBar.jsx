import PropTypes from 'prop-types';

const GameStatsBar = ({ totalCatches, streak, longestStreak }) => (
  <div className="game-stats">
    <div className="stat-item">
      <span className="stat-label">Catches</span>
      <span className="stat-value">{totalCatches}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Streak</span>
      <span className="stat-value">{streak}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Longest</span>
      <span className="stat-value">{longestStreak}</span>
    </div>
  </div>
);

GameStatsBar.propTypes = {
  totalCatches: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
  longestStreak: PropTypes.number.isRequired
};

export default GameStatsBar;
