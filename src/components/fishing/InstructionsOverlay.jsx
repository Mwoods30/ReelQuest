import PropTypes from 'prop-types';

const RARITY_STYLES = {
  Common:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  Uncommon:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)'  },
  Rare:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  Legendary: { color: '#fbbf24', bg: 'rgba(251,191,36,0.14)',  border: 'rgba(251,191,36,0.4)'  },
};

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Legendary'];

const TIPS = [
  { icon: '🎣', text: 'Cast, then click Reel repeatedly when a fish bites to fill the meter before it escapes.' },
  { icon: '🔥', text: 'Keep your streak alive — each consecutive catch multiplies your bonus points.' },
  { icon: '⚡', text: 'Higher levels make fish harder to land. Buy upgrades in the shop to keep up.' },
  { icon: '💰', text: 'Sell your catch after each run to fund new environments and rod upgrades.' },
];

const InstructionsOverlay = ({ onClose, fishTypes }) => {
  const grouped = RARITIES.reduce((acc, rarity) => {
    acc[rarity] = fishTypes.filter(f => f.rarity === rarity);
    return acc;
  }, {});

  return (
    <div className="instructions-overlay">
      <div className="instructions-content">
        <div className="instructions-header">
          <div>
            <h3>How to Play</h3>
            <p className="instructions-subtitle">Master the waters in 60 seconds</p>
          </div>
          <button className="close-overlay-button" onClick={onClose}>✕</button>
        </div>

        <div className="tips-grid">
          {TIPS.map(tip => (
            <div key={tip.text} className="tip-card">
              <span className="tip-icon">{tip.icon}</span>
              <p className="tip-text">{tip.text}</p>
            </div>
          ))}
        </div>

        <div className="fish-guide">
          <h4>🐟 Species Guide</h4>
          <div className="fish-guide-groups">
            {RARITIES.map(rarity => {
              const style = RARITY_STYLES[rarity];
              const fish = grouped[rarity];
              if (!fish?.length) return null;
              return (
                <div key={rarity} className="fish-rarity-group" style={{ borderColor: style.border }}>
                  <div className="fish-rarity-label" style={{ color: style.color, background: style.bg }}>
                    {rarity}
                  </div>
                  <div className="fish-list">
                    {fish.map(f => (
                      <div key={f.name} className="fish-item" style={{ borderColor: style.border }}>
                        <span className="fish-emoji" aria-hidden="true">{f.emoji}</span>
                        <div className="fish-details">
                          <span className="fish-item-name">{f.name}</span>
                          <span className="fish-item-stats" style={{ color: style.color }}>
                            {f.points} pts · {f.value} coins · {f.minSize}–{f.maxSize}"
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

InstructionsOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  fishTypes: PropTypes.array.isRequired
};

export default InstructionsOverlay;
