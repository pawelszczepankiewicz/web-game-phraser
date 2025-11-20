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
 * Load all game data into the store
 */
export function loadGameData(data) {
  const store = getGameStore();
  if (store) {
    store.loadGameData(data);
  }
}

/**
 * Setup event listeners for Vue -> Phaser communication
 */
export function setupVueEventListeners(scene) {
  // Equip item event
  window.addEventListener('equip-item', (event) => {
    if (scene.inventorySystem) {
      scene.inventorySystem.equipItem(event.detail.instanceId);
      // Update Vue store
      updateInventory(scene.inventorySystem.exportInventory());
      updateStats(scene.statsSystem.exportStats());
    }
  });

  // Unequip item event
  window.addEventListener('unequip-item', (event) => {
    if (scene.inventorySystem) {
      scene.inventorySystem.unequipItem(event.detail.slot);
      // Update Vue store
      updateInventory(scene.inventorySystem.exportInventory());
      updateStats(scene.statsSystem.exportStats());
    }
  });

  // Logout event
  window.addEventListener('logout', () => {
    if (scene.autoSave) {
      scene.autoSave();
    }
    scene.storage.clearAllData();
    scene.scene.start('LoginScene');
  });

  console.log('Vue event listeners setup');
}
