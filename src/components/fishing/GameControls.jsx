import PropTypes from 'prop-types';
import { PHASES } from './constants.js';

const GameControls = ({
  phase,
  castLine,
  handleReel,
  endGame,
  startGame,
  isPlaying,
  statusMessage,
  renderNavigationTabs
}) => (
  <div className="game-controls">
    <div className="game-control-row">
      {(() => {
        switch (phase) {
          case PHASES.READY:
            return (
              <button className="cast-button" type="button" onClick={castLine}>
                Cast Line
              </button>
            );
          case PHASES.WAITING:
            return (
              <button className="cast-button casting" type="button" disabled>
                Waiting for a bite…
              </button>
            );
          case PHASES.HOOKED:
            return (
              <button className="cast-button" type="button" onClick={handleReel}>
                Reel!
              </button>
            );
          case PHASES.CELEBRATE:
            return (
              <button className="cast-button" type="button" onClick={castLine}>
                Cast Again
              </button>
            );
          default:
            return null;
        }
      })()}

      {isPlaying ? (
        <button className="end-game-button" type="button" onClick={endGame}>
          End Run
        </button>
      ) : null}
    </div>

    {phase === PHASES.ENDED ? (
      <div className="game-control-row">
        <button className="play-again-button" type="button" onClick={startGame}>
          Fish Again
        </button>
      </div>
    ) : null}

    {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

    {typeof renderNavigationTabs === 'function' ? (
      <div className="game-bottom-nav">
        {renderNavigationTabs('game')}
      </div>
    ) : null}
  </div>
);

GameControls.propTypes = {
  phase: PropTypes.string.isRequired,
  castLine: PropTypes.func.isRequired,
  handleReel: PropTypes.func.isRequired,
  endGame: PropTypes.func.isRequired,
  startGame: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  statusMessage: PropTypes.string,
  renderNavigationTabs: PropTypes.func
};

export default GameControls;
