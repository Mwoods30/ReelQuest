import PropTypes from 'prop-types';

const InstructionsOverlay = ({ onClose, fishTypes }) => (
  <div className="instructions-overlay">
    <div className="instructions-content">
      <h3>How to Play</h3>
      <button className="close-overlay-button" onClick={onClose}>✕</button>
      <ul>
        <li>Hit &quot;Start Fishing&quot; then cast your line to begin the 60 second run.</li>
        <li>When a fish bites, click &quot;Reel&quot; repeatedly to fill the meter.</li>
        <li>Keep your streak alive to earn bonus points on every catch.</li>
        <li>Legendary fish are rare, but worth big points when you land them.</li>
      </ul>
      <div className="fish-guide">
        <h4>Species Guide</h4>
        <div className="fish-list">
          {fishTypes.map((fish) => (
            <div key={fish.name} className="fish-item">
              <span className="fish-emoji" aria-hidden="true">
                {fish.emoji}
              </span>
              <div className="fish-details">
                <div>{fish.name}</div>
                <div>
                  {fish.points} pts • {fish.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

InstructionsOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  fishTypes: PropTypes.array.isRequired
};

export default InstructionsOverlay;
