import PropTypes from 'prop-types';

const LeaderboardOverlay = ({ onClose, playerStats, globalLeaderboard, playerData }) => (
  <div className="leaderboard-overlay">
    <div className="leaderboard-content">
      <div className="leaderboard-header">
        <h3>🏆 Global Leaderboard</h3>
        <p>Top fishers from around the world</p>
        <button className="close-overlay-button" onClick={onClose}>✕</button>
      </div>
      
      <div className="stats-section">
        <h4>📊 Your Statistics</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{playerStats.gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{playerStats.bestScore}</span>
            <span className="stat-label">Best Score</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{playerStats.avgScore}</span>
            <span className="stat-label">Avg Score</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{playerStats.bestStreak}</span>
            <span className="stat-label">Best Streak</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{playerStats.totalCatches}</span>
            <span className="stat-label">Total Catches</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{Math.floor(playerStats.totalPlayTime / 60)}m</span>
            <span className="stat-label">Play Time</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-section">
        <h4>🥇 Top Scores</h4>
        <div className="leaderboard-list">
          {globalLeaderboard.slice(0, 20).map((entry, index) => (
            <div 
              key={entry.id} 
              className={`leaderboard-entry ${
                entry.playerName === playerData.playerName ? 'current-player' : ''
              }`}
            >
              <div className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div className="player-info">
                <div className="player-name">{entry.playerName}</div>
                <div className="player-meta">
                  Level {entry.level} • {entry.date}
                </div>
              </div>
              <div className="score-info">
                <div className="score">{entry.score} pts</div>
                <div className="catches">{entry.catches} catches</div>
              </div>
              <div className="streak">
                {entry.longestStreak} streak
              </div>
            </div>
          ))}
          {globalLeaderboard.length === 0 && (
            <div className="empty-leaderboard">
              <p>No scores yet. Be the first to set a record!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

LeaderboardOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  playerStats: PropTypes.object.isRequired,
  globalLeaderboard: PropTypes.array.isRequired,
  playerData: PropTypes.object.isRequired
};

export default LeaderboardOverlay;
