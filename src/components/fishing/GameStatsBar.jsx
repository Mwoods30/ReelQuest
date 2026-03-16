import PropTypes from 'prop-types';

const GameStatsBar = ({ totalCatches, streak, longestStreak }) => (
  <div className="game-stats">
    <div className="stat-item">
      <span className="stat-label">Catches</span>
      <span className="stat-value">{totalCatches}</span>
    </div>
    <div className="stat-item stat-streak">
      <span className="stat-label">Streak</span>
      <span className={`stat-value${streak > 2 ? ' streak-hot' : ''}`}>
        {streak > 0 ? `${streak}🔥` : '—'}
      </span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Best Streak</span>
      <span className="stat-value">{longestStreak > 0 ? `${longestStreak}x` : '—'}</span>
    </div>
  </div>
);

GameStatsBar.propTypes = {
  totalCatches: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
  longestStreak: PropTypes.number.isRequired
};

export default GameStatsBar;
