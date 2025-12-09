/**
 * VueBridge - Connects Phaser to Vue/Pinia store
 * This module provides methods for Phaser to interact with Vue state
 */

import { socketManager } from "./SocketManager.js";

let gameStore = null;

/**
 * Initialize the bridge with the game store
 * Called from Vue app after store is created
 */
export function initVueBridge(store) {
  gameStore = store;
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

    // Sync quick slots - remove items that no longer exist in backpack
    syncQuickSlotsWithInventory(inventory);
  }
}

/**
 * Sync quick slots with inventory - remove items that no longer exist
 */
function syncQuickSlotsWithInventory(inventory) {
  const store = getGameStore();
  if (!store || !inventory.backpack) return;

  const backpackInstanceIds = new Set(inventory.backpack.map(item => item.instanceId));

  // Check each quick slot
  store.quickSlots.forEach((slotItem, index) => {
    if (slotItem && !backpackInstanceIds.has(slotItem.instanceId)) {
      // Item no longer exists in backpack, remove from quick slot
      store.unassignQuickSlot(index);
    } else if (slotItem && backpackInstanceIds.has(slotItem.instanceId)) {
      // Item still exists, update with latest data (e.g., quantity changes)
      const updatedItem = inventory.backpack.find(item => item.instanceId === slotItem.instanceId);
      if (updatedItem) {
        store.updateQuickSlotItem(index, updatedItem);
      }
    }
  });
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
export function showToast(message, type = "info", duration = 3000) {
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
    window.removeEventListener("equip-item", eventListeners.equipItem);
  }
  if (eventListeners.unequipItem) {
    window.removeEventListener("unequip-item", eventListeners.unequipItem);
  }
  if (eventListeners.logout) {
    window.removeEventListener("logout", eventListeners.logout);
  }
  if (eventListeners.pickupLootItem) {
    window.removeEventListener("pickup-loot-item", eventListeners.pickupLootItem);
  }
  if (eventListeners.useItem) {
    window.removeEventListener("use-item", eventListeners.useItem);
  }
  if (eventListeners.useQuickSlot) {
    window.removeEventListener("use-quick-slot", eventListeners.useQuickSlot);
  }
  if (eventListeners.buyItem) {
    window.removeEventListener("buy-item", eventListeners.buyItem);
  }
  if (eventListeners.sellItem) {
    window.removeEventListener("sell-item", eventListeners.sellItem);
  }
  if (eventListeners.acceptQuest) {
    window.removeEventListener("accept-quest", eventListeners.acceptQuest);
  }
  if (eventListeners.claimQuestReward) {
    window.removeEventListener("claim-quest-reward", eventListeners.claimQuestReward);
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
  window.addEventListener("equip-item", eventListeners.equipItem);

  // Unequip item event
  eventListeners.unequipItem = (event) => {
    if (scene.inventorySystem) {
      scene.inventorySystem.unequipItem(event.detail.slot);
      // Update Vue store
      updateInventory(scene.inventorySystem.exportInventory());
      updateStats(scene.statsSystem.exportStats());
    }
  };
  window.addEventListener("unequip-item", eventListeners.unequipItem);

  // Logout event
  eventListeners.logout = async () => {
    if (scene.autoSave) {
      scene.autoSave();
    }
    scene.storage.clearAllData();

    // Sign out from Firebase and disconnect socket
    // Then reload page to show login screen
    window.location.reload();
  };
  window.addEventListener("logout", eventListeners.logout);

  // Pickup loot item event
  eventListeners.pickupLootItem = async (event) => {
    const { instanceId, lootBagRef } = event.detail;

    if (scene.inventorySystem && lootBagRef) {
      // Try to add item to inventory
      const item = lootBagRef.items.find((i) => i.instanceId === instanceId);

      if (!item) {
        console.warn("Item not found in loot bag");
        return;
      }

      // Check if inventory has space first
      const canAdd = scene.inventorySystem.hasSpace(item.itemId, item.quantity);
      if (!canAdd) {
        showToast("Your backpack is full! Cannot pick up more items.", "warning", 3000);
        return;
      }

      // Send pickup request to server (for multiplayer sync)
      if (socketManager && socketManager.isReady() && lootBagRef.serverId) {
        // Server-managed loot bag - request pickup from server
        socketManager.sendLootBagPickupItem(lootBagRef.serverId, instanceId);

        // Listen for server response
        const handlePickupSuccess = (data) => {
          if (data.instanceId === instanceId) {
            // Add item to inventory
            scene.inventorySystem.addItem(item.itemId, item.quantity);

            // IMPORTANT: Remove item from loot bag entity (not just Vue store)
            lootBagRef.removeItem(instanceId);

            // Update Vue stores
            updateInventory(scene.inventorySystem.exportInventory());
            removeItemFromLoot(instanceId);

            showToast(`Picked up ${item.name}`, "success", 2000);

            // Cleanup listener
            socketManager.off("loot-bag-pickup-success", handlePickupSuccess);
            socketManager.off("loot-bag-pickup-failed", handlePickupFailed);
          }
        };

        const handlePickupFailed = (data) => {
          if (data.error) {
            console.error("Pickup failed:", data.error);
            showToast("Failed to pick up item", "error", 2000);

            // Cleanup listener
            socketManager.off("loot-bag-pickup-success", handlePickupSuccess);
            socketManager.off("loot-bag-pickup-failed", handlePickupFailed);
          }
        };

        socketManager.on("loot-bag-pickup-success", handlePickupSuccess);
        socketManager.on("loot-bag-pickup-failed", handlePickupFailed);
      } else {
        // Fallback for single-player or client-managed loot bags
        const added = scene.inventorySystem.addItem(item.itemId, item.quantity);

        if (added) {
          // Remove item from loot bag
          lootBagRef.removeItem(instanceId);

          // Update Vue stores
          updateInventory(scene.inventorySystem.exportInventory());
          removeItemFromLoot(instanceId);

          showToast(`Picked up ${item.name}`, "success", 2000);
        }
      }
    }
  };
  window.addEventListener("pickup-loot-item", eventListeners.pickupLootItem);

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
  window.addEventListener("use-item", eventListeners.useItem);

  // Use quick slot event
  eventListeners.useQuickSlot = (event) => {
    const { slotIndex } = event.detail;
    const store = window.__GAME_STORE__;

    if (!store || !scene.inventorySystem) return;

    const item = store.quickSlots[slotIndex];
    if (!item) {
      return;
    }

    // Use the item by instance ID
    const used = scene.inventorySystem.useItem(item.instanceId);

    if (used) {
      // Update Vue stores
      updateInventory(scene.inventorySystem.exportInventory());
      updateStats(scene.statsSystem.exportStats());

      // Update the quick slot with the updated item from store's backpack (or remove if consumed)
      const updatedItem = store.inventory.backpack.find((i) => i.instanceId === item.instanceId);

      if (updatedItem) {
        store.updateQuickSlotItem(slotIndex, updatedItem);
      } else {
        // Item was consumed completely
        store.unassignQuickSlot(slotIndex);
      }
    }
  };
  window.addEventListener("use-quick-slot", eventListeners.useQuickSlot);

  // Buy item event
  eventListeners.buyItem = (event) => {
    if (scene.inventorySystem) {
      const { itemId, price } = event.detail;

      // Try to buy item (handles gold removal and item addition)
      const result = scene.inventorySystem.buyItem(itemId, price);

      if (result.success) {
        // Update Vue stores
        updateInventory(scene.inventorySystem.exportInventory());

        showToast(`Purchased item for ${price} gold`, "success", 2000);
      } else {
        // Show appropriate error message
        if (result.reason === "insufficient_gold") {
          showToast(`Not enough gold! Need ${price} gold.`, "error", 3000);
        } else if (result.reason === "backpack_full") {
          showToast("Your backpack is full!", "warning", 3000);
        } else {
          showToast("Failed to purchase item", "error", 3000);
        }
      }
    }
  };
  window.addEventListener("buy-item", eventListeners.buyItem);

  // Sell item event
  eventListeners.sellItem = (event) => {
    if (scene.inventorySystem) {
      const { instanceId, price } = event.detail;

      // Try to sell item (handles item removal and gold addition)
      const result = scene.inventorySystem.sellItem(instanceId, price);

      if (result.success) {
        // Update Vue stores
        updateInventory(scene.inventorySystem.exportInventory());

        showToast(`Sold item for ${price} gold`, "success", 2000);
      } else {
        // Show appropriate error message
        if (result.reason === "insufficient_space") {
          showToast(`Not enough space in backpack for ${price} gold!`, "warning", 3000);
        } else if (result.reason === "item_not_found") {
          showToast("Item not found in inventory", "error", 3000);
        } else {
          showToast("Failed to sell item", "error", 3000);
        }
      }
    }
  };
  window.addEventListener("sell-item", eventListeners.sellItem);

  // Accept quest event
  eventListeners.acceptQuest = (event) => {
    if (scene.questSystem) {
      const { questId } = event.detail;

      // Start the quest
      scene.questSystem.startQuest(questId);

      // Update Vue store
      const store = window.__GAME_STORE__;
      if (store) {
        store.updateQuests({
          active: scene.questSystem.activeQuests,
          completed: scene.questSystem.completedQuests,
        });
      }
    }
  };
  window.addEventListener("accept-quest", eventListeners.acceptQuest);

  // Claim quest reward event
  eventListeners.claimQuestReward = (event) => {
    const { questInstanceId, rewardType, rewardValue } = event.detail;
    const store = window.__GAME_STORE__;

    if (!scene.questSystem || !scene.inventorySystem || !store) return;

    // Find the quest
    const quest = store.quests.completed.find((q) => q.instanceId === questInstanceId);
    if (!quest) {
      console.warn("Quest not found");
      return;
    }

    // Claim based on reward type
    if (rewardType === "gold") {
      scene.inventorySystem.addGold(rewardValue);
      updateGold(scene.inventorySystem.getGold());
      showToast(`Received ${rewardValue} gold!`, "success", 2000);

      // Remove gold from quest rewards
      quest.rewards.gold = 0;
    } else if (rewardType === "item") {
      const added = scene.inventorySystem.addItem(rewardValue, 1);
      if (added) {
        updateInventory(scene.inventorySystem.exportInventory());
        showToast(`Received ${rewardValue}!`, "success", 2000);

        // Remove item from quest rewards
        const index = quest.rewards.items.indexOf(rewardValue);
        if (index > -1) {
          quest.rewards.items.splice(index, 1);
        }
      } else {
        showToast("Your backpack is full!", "warning", 3000);
        return;
      }
    }

    // Check if all rewards claimed
    if (quest.rewards.gold === 0 && (!quest.rewards.items || quest.rewards.items.length === 0)) {
      // Mark quest as rewarded and remove from completed
      quest.status = "rewarded";
      const index = store.quests.completed.findIndex((q) => q.instanceId === questInstanceId);
      if (index > -1) {
        store.quests.completed.splice(index, 1);
      }
      showToast("Quest rewards fully claimed!", "success", 3000);
    }

    // Update quest store
    store.updateQuests({
      active: scene.questSystem.activeQuests,
      completed: scene.questSystem.completedQuests,
    });
  };
  window.addEventListener("claim-quest-reward", eventListeners.claimQuestReward);
}
