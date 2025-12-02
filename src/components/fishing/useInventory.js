import { useCallback } from 'react';

/**
 * Inventory and shop logic extracted for readability.
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
  ACHIEVEMENTS,
  OFFLINE_MODE
}) => {
  const sellFish = useCallback(async (fishId) => {
    const fishToSell = inventory.find((fish) => fish.id === fishId);
    if (!fishToSell) return;

    const saleValue = fishToSell.value;
    const updatedInventory = inventory.filter((fish) => fish.id !== fishId);

    if (isAuthenticated && user && !OFFLINE_MODE) {
      const { sellFishFromInventory } = await import('../../firebase/database.js');
      const result = await sellFishFromInventory(user.uid, fishId, saleValue, updatedInventory);
      if (result.success) {
        setInventory(updatedInventory);
        const updatedPlayerData = {
          ...playerData,
          currency: (playerData.currency || 0) + saleValue,
          totalFishSold: (playerData.totalFishSold || 0) + 1,
          inventory: updatedInventory
        };
        syncPlayerData(updatedPlayerData);
        persistProgress({
          currency: updatedPlayerData.currency,
          totalFishSold: updatedPlayerData.totalFishSold,
          inventory: updatedInventory
        });
        setStatusMessage(`Sold ${fishToSell.name} for ${saleValue} coins!`);
      } else {
        setStatusMessage('Failed to sell fish. Please try again.');
      }
    } else {
      const updatedPlayerData = {
        ...playerData,
        currency: (playerData.currency || 0) + saleValue,
        totalFishSold: (playerData.totalFishSold || 0) + 1,
        inventory: updatedInventory
      };

      setInventory(updatedInventory);
      syncPlayerData(updatedPlayerData);
      writePlayerData(updatedPlayerData);
      setStatusMessage(`Sold ${fishToSell.name} for ${saleValue} coins!`);
    }
  }, [inventory, isAuthenticated, user, OFFLINE_MODE, setInventory, playerData, syncPlayerData, persistProgress, setStatusMessage, writePlayerData]);

  const sellAllFish = useCallback(async () => {
    if (inventory.length === 0) return;

    const totalValue = inventory.reduce((sum, fish) => sum + fish.value, 0);

    if (isAuthenticated && user && !OFFLINE_MODE) {
      const { sellFishFromInventory } = await import('../../firebase/database.js');
      const result = await sellFishFromInventory(user.uid, 'all', totalValue, []);
      if (result.success) {
        setInventory([]);
        const updatedPlayerData = {
          ...playerData,
          currency: (playerData.currency || 0) + totalValue,
          totalFishSold: (playerData.totalFishSold || 0) + inventory.length,
          inventory: []
        };
        syncPlayerData(updatedPlayerData);
        persistProgress({
          currency: updatedPlayerData.currency,
          totalFishSold: updatedPlayerData.totalFishSold,
          inventory: []
        });
        setStatusMessage(`Sold all fish for ${totalValue} coins!`);
      } else {
        setStatusMessage('Failed to sell fish. Please try again.');
      }
    } else {
      const updatedPlayerData = {
        ...playerData,
        currency: (playerData.currency || 0) + totalValue,
        totalFishSold: (playerData.totalFishSold || 0) + inventory.length,
        inventory: []
      };

      setInventory([]);
      syncPlayerData(updatedPlayerData);
      writePlayerData(updatedPlayerData);
      setStatusMessage(`Sold all fish for ${totalValue} coins!`);
    }
  }, [inventory, isAuthenticated, user, OFFLINE_MODE, setInventory, playerData, syncPlayerData, persistProgress, setStatusMessage, writePlayerData]);

  const purchaseItem = useCallback((itemType, itemId) => {
    const items = SHOP_ITEMS[itemType];
    const item = items?.find((i) => i.id === itemId);

    if (!item) {
      setStatusMessage('Item not found.');
      return;
    }

    if (itemType === 'environments') {
      const alreadyOwned = (playerData.ownedEnvironments || ['crystal_lake']).includes(itemId);
      if (alreadyOwned) {
        setStatusMessage('Environment already unlocked. Equip it from your inventory.');
        return;
      }
    }

    if ((playerData.currency || 0) < item.price) {
      setStatusMessage('Not enough coins for this purchase.');
      return;
    }

    if ((playerData.level || 1) < item.levelRequired) {
      setStatusMessage(`Reach level ${item.levelRequired} to unlock this item.`);
      return;
    }

    const updatedPlayerData = {
      ...playerData,
      currency: (playerData.currency || 0) - item.price,
      totalPurchases: (playerData.totalPurchases || 0) + 1
    };

    if (itemType === 'environments') {
      const nextOwned = new Set(playerData.ownedEnvironments || ['crystal_lake']);
      nextOwned.add(itemId);
      updatedPlayerData.ownedEnvironments = Array.from(nextOwned);
      updatedPlayerData.currentEnvironment = itemId;
    } else if (itemType === 'upgrades') {
      updatedPlayerData.ownedUpgrades = [...(playerData.ownedUpgrades || []), itemId];
    }

    const newStats = { ...updatedPlayerData };
    const newAchievements = checkAchievements(playerData, newStats);

    if (newAchievements.length > 0) {
      updatedPlayerData.achievements = [
        ...(playerData.achievements || []),
        ...newAchievements.map((a) => a.id)
      ];
      const achievementReward = newAchievements.reduce(
        (sum, achievement) => sum + achievement.reward,
        0
      );
      updatedPlayerData.currency += achievementReward;
    }

    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    if (isAuthenticated && user && !OFFLINE_MODE) {
      const persistPayload = {
        currency: updatedPlayerData.currency,
        totalPurchases: updatedPlayerData.totalPurchases,
        achievements: updatedPlayerData.achievements
      };

      if (itemType === 'environments') {
        persistPayload.ownedEnvironments = updatedPlayerData.ownedEnvironments;
        persistPayload.currentEnvironment = updatedPlayerData.currentEnvironment;
      } else if (itemType === 'upgrades') {
        persistPayload.ownedUpgrades = updatedPlayerData.ownedUpgrades;
      }

      persistProgress(persistPayload);
    }

    const itemName = ENVIRONMENT_LIBRARY[itemId]?.name || item.name;
    let purchaseMsg = `Purchased ${itemName}!`;
    if (itemType === 'environments') {
      purchaseMsg = `Unlocked ${itemName}! Equipped automatically.`;
    }
    if (newAchievements.length > 0) {
      purchaseMsg += ' Achievement unlocked!';
    }
    setStatusMessage(purchaseMsg);
  }, [SHOP_ITEMS, playerData, checkAchievements, syncPlayerData, writePlayerData, isAuthenticated, user, OFFLINE_MODE, persistProgress, setStatusMessage]);

  const equipEnvironment = useCallback((environmentId) => {
    const envConfig = ENVIRONMENT_LIBRARY[environmentId];
    if (!envConfig) {
      setStatusMessage('Environment not available.');
      return;
    }
    const owned = (playerData.ownedEnvironments || ['crystal_lake']).includes(environmentId);

    if (!owned) {
      setStatusMessage('Unlock this environment in the shop first.');
      return;
    }

    if (playerData.currentEnvironment === environmentId) {
      setStatusMessage(`${envConfig?.name || 'Environment'} already equipped.`);
      return;
    }

    const updatedPlayerData = {
      ...playerData,
      currentEnvironment: environmentId
    };
    syncPlayerData(updatedPlayerData);
    writePlayerData(updatedPlayerData);

    if (isAuthenticated && user && !OFFLINE_MODE) {
      persistProgress({
        currentEnvironment: environmentId
      });
    }

    setStatusMessage(`${envConfig?.name || 'Environment'} equipped!`);
  }, [ENVIRONMENT_LIBRARY, playerData, syncPlayerData, writePlayerData, isAuthenticated, user, OFFLINE_MODE, persistProgress, setStatusMessage]);

  return { sellFish, sellAllFish, purchaseItem, equipEnvironment };
};

export default useInventory;
