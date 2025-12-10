import { useCallback } from 'react';

/**
 * Inventory + Shop Hooks
 * - Cleaned, optimized, reduced duplication
 */
export const useInventory = ({
  inventory,
  playerData,
  setInventory,
  syncPlayerData,
  persistProgress,
  isAuthenticated,
  user,
  setStatusMessage,
  checkAchievements,
  writePlayerData,
  ENVIRONMENT_LIBRARY,
  SHOP_ITEMS,
  OFFLINE_MODE
}) => {

  /** ---------------------- SELL SINGLE FISH ---------------------- **/
  const sellFish = useCallback(async (fishId) => {
    const fish = inventory.find(f => f.id === fishId);
    if (!fish) return;

    const saleValue = fish.value;
    const updatedInventory = inventory.filter(f => f.id !== fishId);

    const updatedPlayerData = {
      ...playerData,
      currency: (playerData.currency || 0) + saleValue,
      totalFishSold: (playerData.totalFishSold || 0) + 1,
      inventory: updatedInventory
    };

    // Online mode
    if (isAuthenticated && user && !OFFLINE_MODE) {
      const { sellFishFromInventory } = await import('../../firebase/database.js');
      const result = await sellFishFromInventory(user.uid, fishId, saleValue, updatedInventory);

      if (!result.success) {
        setStatusMessage('Failed to sell fish. Please try again.');
        return;
      }

      persistProgress({
        currency: updatedPlayerData.currency,
        totalFishSold: updatedPlayerData.totalFishSold,
        inventory: updatedInventory
      });
    }

    // Local + Sync
    setInventory(updatedInventory);
    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    setStatusMessage(`Sold ${fish.name} for ${saleValue} coins!`);
  }, [
    inventory, playerData, isAuthenticated, user, OFFLINE_MODE,
    setInventory, syncPlayerData, persistProgress,
    writePlayerData, setStatusMessage
  ]);


  /** ---------------------- SELL ALL FISH ---------------------- **/
  const sellAllFish = useCallback(async () => {
    if (inventory.length === 0) return;

    const totalValue = inventory.reduce((sum, f) => sum + f.value, 0);

    const updatedPlayerData = {
      ...playerData,
      currency: (playerData.currency || 0) + totalValue,
      totalFishSold: (playerData.totalFishSold || 0) + inventory.length,
      inventory: []
    };

    // Online mode
    if (isAuthenticated && user && !OFFLINE_MODE) {
      const { sellFishFromInventory } = await import('../../firebase/database.js');
      const result = await sellFishFromInventory(user.uid, 'all', totalValue, []);

      if (!result.success) {
        setStatusMessage('Failed to sell fish. Please try again.');
        return;
      }

      persistProgress({
        currency: updatedPlayerData.currency,
        totalFishSold: updatedPlayerData.totalFishSold,
        inventory: []
      });
    }

    // Local + Sync
    setInventory([]);
    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    setStatusMessage(`Sold all fish for ${totalValue} coins!`);
  }, [
    inventory, playerData, isAuthenticated, user, OFFLINE_MODE,
    setInventory, syncPlayerData, persistProgress,
    writePlayerData, setStatusMessage
  ]);


  /** ---------------------- PURCHASE SHOP ITEM ---------------------- **/
  const purchaseItem = useCallback((itemType, itemId) => {
    const items = SHOP_ITEMS[itemType];
    const item = items?.find(i => i.id === itemId);
    if (!item) return setStatusMessage('Item not found.');

    // Environment rules
    if (itemType === 'environments') {
      const owned = new Set(playerData.ownedEnvironments || ['crystal_lake']);
      if (owned.has(itemId)) {
        return setStatusMessage('Environment already unlocked. Equip it from your inventory.');
      }
    }

    // Requirements
    if ((playerData.currency || 0) < item.price)
      return setStatusMessage('Not enough coins for this purchase.');

    if ((playerData.level || 1) < item.levelRequired)
      return setStatusMessage(`Reach level ${item.levelRequired} to unlock this item.`);

    /** Update player data **/
    const updatedPlayerData = {
      ...playerData,
      currency: (playerData.currency || 0) - item.price,
      totalPurchases: (playerData.totalPurchases || 0) + 1
    };

    if (itemType === 'environments') {
      const owned = new Set(playerData.ownedEnvironments || ['crystal_lake']);
      owned.add(itemId);
      updatedPlayerData.ownedEnvironments = [...owned];
      updatedPlayerData.currentEnvironment = itemId;
    }

    if (itemType === 'upgrades') {
      updatedPlayerData.ownedUpgrades = [
        ...(playerData.ownedUpgrades || []),
        itemId
      ];
    }

    /** Achievements **/
    const newAchievements = checkAchievements(playerData, updatedPlayerData);
    if (newAchievements.length > 0) {
      updatedPlayerData.achievements = [
        ...(playerData.achievements || []),
        ...newAchievements.map(a => a.id)
      ];

      const reward = newAchievements.reduce((sum, a) => sum + a.reward, 0);
      updatedPlayerData.currency += reward;
    }

    /** Sync data **/
    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    if (isAuthenticated && user && !OFFLINE_MODE) {
      const payload = {
        currency: updatedPlayerData.currency,
        totalPurchases: updatedPlayerData.totalPurchases,
        achievements: updatedPlayerData.achievements
      };

      if (itemType === 'environments') {
        payload.ownedEnvironments = updatedPlayerData.ownedEnvironments;
        payload.currentEnvironment = updatedPlayerData.currentEnvironment;
      } else {
        payload.ownedUpgrades = updatedPlayerData.ownedUpgrades;
      }

      persistProgress(payload);
    }

    /** Message **/
    const itemName = ENVIRONMENT_LIBRARY[itemId]?.name || item.name;
    let msg = itemType === 'environments'
      ? `Unlocked ${itemName}! Equipped automatically.`
      : `Purchased ${itemName}!`;

    if (newAchievements.length > 0) msg += ' Achievement unlocked!';

    setStatusMessage(msg);

  }, [
    SHOP_ITEMS, playerData, checkAchievements,
    syncPlayerData, writePlayerData, persistProgress,
    isAuthenticated, user, OFFLINE_MODE,
    setStatusMessage, ENVIRONMENT_LIBRARY
  ]);


  /** ---------------------- EQUIP ENVIRONMENT ---------------------- **/
  const equipEnvironment = useCallback((environmentId) => {
    const env = ENVIRONMENT_LIBRARY[environmentId];
    if (!env) return setStatusMessage('Environment not available.');

    const owned = (playerData.ownedEnvironments || ['crystal_lake']).includes(environmentId);
    if (!owned) return setStatusMessage('Unlock this environment in the shop first.');

    if (playerData.currentEnvironment === environmentId)
      return setStatusMessage(`${env.name} already equipped.`);

    const updatedPlayerData = {
      ...playerData,
      currentEnvironment: environmentId
    };

    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    if (isAuthenticated && user && !OFFLINE_MODE) {
      persistProgress({ currentEnvironment: environmentId });
    }

    setStatusMessage(`${env.name} equipped!`);
  }, [
    ENVIRONMENT_LIBRARY, playerData, syncPlayerData,
    writePlayerData, isAuthenticated, user,
    OFFLINE_MODE, persistProgress, setStatusMessage
  ]);


  return { sellFish, sellAllFish, purchaseItem, equipEnvironment };
};

export default useInventory;
