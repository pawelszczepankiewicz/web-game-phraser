/**
 * VueBridge - Connects Phaser to Vue/Pinia store
 * This module provides methods for Phaser to interact with Vue state
 */

let gameStore = null;

/**
 * Initialize the bridge with the game store
 * Called from Vue app after store is created
 */
export function initVueBridge(store) {
  gameStore = store;
  console.log('Vue Bridge initialized');
}

/**
 * Get the game store instance
 */
export function getGameStore() {
  if (!gameStore) {
    // Try to get it from window (set by Vue app)
    gameStore = window.__GAME_STORE__;
  }
  return gameStore;
}

/**
 * Update character data
 */
export function updateCharacter(data) {
  const store = getGameStore();
  if (store) {
    store.updateCharacter(data);
  }
}

/**
 * Update player position
 */
export function updatePosition(x, y) {
  const store = getGameStore();
  if (store) {
    store.updatePosition(x, y);
  }
}

/**
 * Update stats
 */
export function updateStats(stats) {
  const store = getGameStore();
  if (store) {
    store.updateStats(stats);
  }
}

/**
 * Update inventory
 */
export function updateInventory(inventory) {
  const store = getGameStore();
  if (store) {
    store.updateInventory(inventory);
  }
}

/**
 * Update quests
 */
export function updateQuests(quests) {
  const store = getGameStore();
  if (store) {
    store.updateQuests(quests);
  }
}

/**
 * Open loot bag UI
 */
export function openLootBag(lootBagRef, items) {
  const store = getGameStore();
  if (store) {
    store.openLootBag(lootBagRef, items);
  }
}

/**
 * Close loot bag UI
 */
export function closeLootBag() {
  const store = getGameStore();
  if (store) {
    store.closeLootBag();
  }
}

/**
 * Remove item from loot bag
 */
export function removeItemFromLoot(instanceId) {
  const store = getGameStore();
  if (store) {
    store.removeItemFromLoot(instanceId);
  }
}

/**
 * Show toast message
 */
export function showToast(message, type = 'info', duration = 3000) {
  const store = getGameStore();
  if (store) {
    store.showToast(message, type, duration);
  }
}

/**
 * Show NPC interaction popup
 */
export function showNPCInteraction(npcData) {
  const store = getGameStore();
  if (store) {
    store.showNPCInteraction(npcData);
  }
}

/**
 * Open trading panel
 */
export function openTrade(traderName, traderInventory) {
  const store = getGameStore();
  if (store) {
    store.openTrade(traderName, traderInventory);
  }
}

/**
 * Update gold amount
 */
export function updateGold(amount) {
  const store = getGameStore();
  if (store) {
    store.updateGold(amount);
  }
}

/**
 * Load all game data into the store
 */
export function loadGameData(data) {
  const store = getGameStore();
  if (store) {
    store.loadGameData(data);
  }
}

// Store listener references to allow cleanup
let eventListeners = {};

/**
 * Setup event listeners for Vue -> Phaser communication
 */
export function setupVueEventListeners(scene) {
  // Remove old listeners if they exist (prevent duplicates on scene restart)
  if (eventListeners.equipItem) {
    window.removeEventListener('equip-item', eventListeners.equipItem);
  }
  if (eventListeners.unequipItem) {
    window.removeEventListener('unequip-item', eventListeners.unequipItem);
  }
  if (eventListeners.logout) {
    window.removeEventListener('logout', eventListeners.logout);
  }
  if (eventListeners.pickupLootItem) {
    window.removeEventListener('pickup-loot-item', eventListeners.pickupLootItem);
  }
  if (eventListeners.useItem) {
    window.removeEventListener('use-item', eventListeners.useItem);
  }
  if (eventListeners.buyItem) {
    window.removeEventListener('buy-item', eventListeners.buyItem);
  }
  if (eventListeners.sellItem) {
    window.removeEventListener('sell-item', eventListeners.sellItem);
  }

  // Equip item event
  eventListeners.equipItem = (event) => {
    if (scene.inventorySystem) {
      scene.inventorySystem.equipItem(event.detail.instanceId);
      // Update Vue store
      updateInventory(scene.inventorySystem.exportInventory());
      updateStats(scene.statsSystem.exportStats());
    }
  };
  window.addEventListener('equip-item', eventListeners.equipItem);

  // Unequip item event
  eventListeners.unequipItem = (event) => {
    if (scene.inventorySystem) {
      scene.inventorySystem.unequipItem(event.detail.slot);
      // Update Vue store
      updateInventory(scene.inventorySystem.exportInventory());
      updateStats(scene.statsSystem.exportStats());
    }
  };
  window.addEventListener('unequip-item', eventListeners.unequipItem);

  // Logout event
  eventListeners.logout = () => {
    if (scene.autoSave) {
      scene.autoSave();
    }
    scene.storage.clearAllData();
    scene.scene.start('LoginScene');
  };
  window.addEventListener('logout', eventListeners.logout);

  // Pickup loot item event
  eventListeners.pickupLootItem = (event) => {
    const { instanceId, lootBagRef } = event.detail;

    if (scene.inventorySystem && lootBagRef) {
      // Try to add item to inventory
      const item = lootBagRef.items.find(i => i.instanceId === instanceId);

      if (item) {
        const added = scene.inventorySystem.addItem(item.itemId, item.quantity);

        if (added) {
          // Remove item from loot bag
          lootBagRef.removeItem(instanceId);

          // Update Vue stores
          updateInventory(scene.inventorySystem.exportInventory());
          removeItemFromLoot(instanceId);

          console.log(`Picked up ${item.name} from loot bag`);
          showToast(`Picked up ${item.name}`, 'success', 2000);
        } else {
          console.log('Inventory is full!');
          showToast('Your backpack is full! Cannot pick up more items.', 'warning', 3000);
        }
      }
    }
  };
  window.addEventListener('pickup-loot-item', eventListeners.pickupLootItem);

  // Use item event
  eventListeners.useItem = (event) => {
    if (scene.inventorySystem) {
      const used = scene.inventorySystem.useItem(event.detail.instanceId);

      if (used) {
        // Update Vue stores
        updateInventory(scene.inventorySystem.exportInventory());
        updateStats(scene.statsSystem.exportStats());
      }
    }
  };
  window.addEventListener('use-item', eventListeners.useItem);

  // Buy item event
  eventListeners.buyItem = (event) => {
    if (scene.inventorySystem) {
      const { itemId, price } = event.detail;

      // Check if player has enough gold
      if (scene.inventorySystem.getGold() < price) {
        showToast(`Not enough gold! Need ${price} gold.`, 'error', 3000);
        return;
      }

      // Try to add item to inventory
      const added = scene.inventorySystem.addItem(itemId, 1);

      if (added) {
        // Remove gold
        scene.inventorySystem.removeGold(price);

        // Update Vue stores
        updateInventory(scene.inventorySystem.exportInventory());
        updateGold(scene.inventorySystem.getGold());

        showToast(`Purchased item for ${price} gold`, 'success', 2000);
      } else {
        showToast('Your backpack is full!', 'warning', 3000);
      }
    }
  };
  window.addEventListener('buy-item', eventListeners.buyItem);

  // Sell item event
  eventListeners.sellItem = (event) => {
    if (scene.inventorySystem) {
      const { instanceId, price } = event.detail;

      // Remove item from inventory
      const removed = scene.inventorySystem.removeItem(instanceId);

      if (removed) {
        // Add gold
        scene.inventorySystem.addGold(price);

        // Update Vue stores
        updateInventory(scene.inventorySystem.exportInventory());
        updateGold(scene.inventorySystem.getGold());

        showToast(`Sold item for ${price} gold`, 'success', 2000);
      }
    }
  };
  window.addEventListener('sell-item', eventListeners.sellItem);

  console.log('Vue event listeners setup');
}
