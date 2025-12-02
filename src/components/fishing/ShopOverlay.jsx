import PropTypes from 'prop-types';

const ShopOverlay = ({
  inventory,
  sellAllFish,
  sellFish,
  environmentInventory,
  activeEnvironment,
  equipEnvironment,
  shopItems,
  ownedEnvironmentIds,
  playerData,
  purchaseItem,
  achievements,
  onClose
}) => {
  const inventoryValue = inventory.reduce((sum, fish) => sum + fish.value, 0);

  return (
    <div className="shop-overlay">
      <div className="shop-content">
        <div className="shop-header">
          <h3>🎒 Your Inventory</h3>
          <p>Sell your fish to earn coins!</p>
          <button className="close-overlay-button" onClick={onClose}>✕</button>
          <div className="shop-stats">
            <span>Fish: {inventory.length}</span>
            <span>Value: {inventoryValue} coins</span>
          </div>
        </div>
        
        {inventory.length > 0 ? (
          <div className="inventory-section">
            <div className="inventory-actions">
              <button 
                className="sell-all-button" 
                onClick={sellAllFish}
              >
                Sell All ({inventoryValue} coins)
              </button>
            </div>
            
            <div className="inventory-grid">
              {inventory.map((fish) => (
                <div key={fish.id} className="inventory-item">
                  <span className="inventory-fish-emoji">{fish.emoji}</span>
                  <div className="inventory-fish-details">
                    <div className="inventory-fish-name">{fish.name}</div>
                    <div className="inventory-fish-meta">
                      {fish.size?.toFixed(1)}&quot; • {fish.rarity}
                    </div>
                    <div className="inventory-fish-value">{fish.value} coins</div>
                  </div>
                  <button 
                    className="sell-fish-button" 
                    onClick={() => sellFish(fish.id)}
                  >
                    Sell
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-inventory">
            <p>No fish in inventory. Go catch some!</p>
          </div>
        )}

        <div className="shop-section environment-inventory-section">
          <h4>🌍 Environment Loadout</h4>
          <p className="environment-inventory-hint">Swap between unlocked locations.</p>
          <div className="environment-inventory-grid">
            {environmentInventory.map((env) => {
              const isActive = env.id === activeEnvironment.id;
              return (
                <div
                  key={env.id}
                  className={`environment-card ${isActive ? 'environment-card-active' : ''}`}
                >
                  <span className="environment-card-emoji">{env.emoji}</span>
                  <div className="environment-card-details">
                    <div className="environment-card-name">{env.name}</div>
                    <div className="environment-card-description">{env.description}</div>
                  </div>
                  <button
                    className="environment-card-button"
                    onClick={() => equipEnvironment(env.id)}
                    disabled={isActive}
                  >
                    {isActive ? 'Equipped' : 'Equip'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="shop-section">
          <h4>🏪 Shop - Environments</h4>
          <div className="shop-grid">
            {shopItems.environments.map((env) => {
              const isOwned = ownedEnvironmentIds.includes(env.id);
              const isEquipped = activeEnvironment.id === env.id;
              const meetsLevel = (playerData.level || 1) >= env.levelRequired;
              const hasCurrency = (playerData.currency || 0) >= env.price;
              const buttonDisabled = isEquipped || (!isOwned && (!meetsLevel || !hasCurrency));
              const buttonLabel = isEquipped
                ? 'Equipped'
                : isOwned
                ? 'Equip'
                : !meetsLevel
                ? `Level ${env.levelRequired}`
                : 'Buy';
              const handleClick = isOwned
                ? () => equipEnvironment(env.id)
                : () => purchaseItem('environments', env.id);

              return (
                <div key={env.id} className="shop-item">
                  <span className="shop-item-emoji">{env.emoji}</span>
                  <div className="shop-item-details">
                    <div className="shop-item-name">{env.name}</div>
                    <div className="shop-item-description">{env.description}</div>
                    <div className="shop-item-requirements">
                      Level {env.levelRequired} • {env.price} coins
                    </div>
                    <div
                      className={`shop-item-status ${
                        isEquipped ? 'shop-item-status-equipped' : isOwned ? 'shop-item-status-owned' : 'shop-item-status-locked'
                      }`}
                    >
                      {isEquipped ? 'Equipped' : isOwned ? 'Owned' : 'Locked'}
                    </div>
                  </div>
                  <button
                    className="shop-purchase-button"
                    onClick={handleClick}
                    disabled={buttonDisabled}
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shop-section">
          <h4>⚙️ Shop - Upgrades</h4>
          <div className="shop-grid">
            {shopItems.upgrades.map((upgrade) => (
              <div key={upgrade.id} className="shop-item">
                <span className="shop-item-emoji">{upgrade.emoji}</span>
                <div className="shop-item-details">
                  <div className="shop-item-name">{upgrade.name}</div>
                  <div className="shop-item-description">{upgrade.description}</div>
                  <div className="shop-item-requirements">
                    Level {upgrade.levelRequired} • {upgrade.price} coins
                  </div>
                </div>
                <button 
                  className="shop-purchase-button" 
                  onClick={() => purchaseItem('upgrades', upgrade.id)}
                  disabled={
                    (playerData.ownedUpgrades || []).includes(upgrade.id) ||
                    playerData.currency < upgrade.price ||
                    playerData.level < upgrade.levelRequired
                  }
                >
                  {(playerData.ownedUpgrades || []).includes(upgrade.id) 
                    ? 'Owned' 
                    : playerData.level < upgrade.levelRequired 
                    ? `Level ${upgrade.levelRequired}` 
                    : 'Buy'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="achievements-section">
          <h4>🏆 Achievements</h4>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`achievement-item ${
                  playerData.achievements?.includes(achievement.id) ? 'unlocked' : 'locked'
                }`}
              >
                <span className="achievement-emoji">{achievement.emoji}</span>
                <div className="achievement-details">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-description">{achievement.description}</div>
                  {playerData.achievements?.includes(achievement.id) && (
                    <div className="achievement-reward">+{achievement.reward} coins</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ShopOverlay.propTypes = {
  inventory: PropTypes.array.isRequired,
  sellAllFish: PropTypes.func.isRequired,
  sellFish: PropTypes.func.isRequired,
  environmentInventory: PropTypes.array.isRequired,
  activeEnvironment: PropTypes.object.isRequired,
  equipEnvironment: PropTypes.func.isRequired,
  shopItems: PropTypes.object.isRequired,
  ownedEnvironmentIds: PropTypes.array.isRequired,
  playerData: PropTypes.object.isRequired,
  purchaseItem: PropTypes.func.isRequired,
  achievements: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ShopOverlay;
