import PropTypes from 'prop-types';

const PODIUM = ['🥇', '🥈', '🥉'];

const LeaderboardOverlay = ({ onClose, playerStats, globalLeaderboard, playerData }) => {
  const top3 = globalLeaderboard.slice(0, 3);
  const rest = globalLeaderboard.slice(3, 20);
  const myRank = globalLeaderboard.findIndex(e => e.playerName === playerData.playerName);

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-content">

        <div className="leaderboard-header">
          <div>
            <h3>🏆 Global Leaderboard</h3>
            <p>Top fishers from around the world</p>
          </div>
          <button className="close-overlay-button" onClick={onClose}>✕</button>
        </div>

        {/* Personal stats */}
        <div className="stats-section">
          <h4>📊 Your Statistics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{playerStats.gamesPlayed}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{playerStats.bestScore}</span>
              <span className="stat-label">Best Score</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{playerStats.avgScore || 0}</span>
              <span className="stat-label">Avg Score</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{playerStats.bestStreak}x</span>
              <span className="stat-label">Best Streak</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{playerStats.totalCatches}</span>
              <span className="stat-label">Catches</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{Math.floor((playerStats.totalPlayTime || 0) / 60)}m</span>
              <span className="stat-label">Play Time</span>
            </div>
          </div>
          {myRank >= 0 && (
            <p className="my-rank-badge">
              You are ranked <strong>#{myRank + 1}</strong> globally
            </p>
          )}
        </div>

        {/* Podium top 3 */}
        {top3.length > 0 && (
          <div className="podium-section">
            <h4>🥇 Top 3</h4>
            <div className="podium-row">
              {top3.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`podium-card podium-${i + 1}${entry.playerName === playerData.playerName ? ' podium-me' : ''}`}
                >
                  <div className="podium-medal">{PODIUM[i]}</div>
                  <div className="podium-name">{entry.playerName}</div>
                  <div className="podium-score">{entry.score}</div>
                  <div className="podium-meta">Lv {entry.level} · {entry.catches} catches</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranks 4–20 */}
        {rest.length > 0 && (
          <div className="leaderboard-section">
            <h4>Rankings</h4>
            <div className="leaderboard-list">
              {rest.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`leaderboard-entry${entry.playerName === playerData.playerName ? ' current-player' : ''}`}
                >
                  <div className="rank">#{i + 4}</div>
                  <div className="player-info">
                    <div className="player-name">{entry.playerName}</div>
                    <div className="player-meta">Lv {entry.level} · {entry.date}</div>
                  </div>
                  <div className="score-info">
                    <div className="score">{entry.score} pts</div>
                    <div className="catches">{entry.catches} catches · {entry.longestStreak}x streak</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {globalLeaderboard.length === 0 && (
          <div className="empty-leaderboard">
            <p>🎣 No scores yet — be the first to set a record!</p>
          </div>
        )}

      </div>
    </div>
  );
};

LeaderboardOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  playerStats: PropTypes.object.isRequired,
  globalLeaderboard: PropTypes.array.isRequired,
  playerData: PropTypes.object.isRequired,
};

export default LeaderboardOverlay;
