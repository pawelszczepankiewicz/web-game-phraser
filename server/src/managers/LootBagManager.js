import LootBag from "../models/LootBag.js";

/**
 * LootBagManager - Manages all loot bags on the server
 */
class LootBagManager {
  constructor() {
    this.lootBags = new Map(); // id -> LootBag
    this.nextId = 1;
  }

  /**
   * Create a new loot bag
   */
  createLootBag(x, y, items, map) {
    const id = `lootbag_${this.nextId++}`;
    const lootBag = new LootBag(id, x, y, items, map);
    this.lootBags.set(id, lootBag);

    return lootBag;
  }

  /**
   * Get a loot bag by ID
   */
  getLootBag(id) {
    return this.lootBags.get(id);
  }

  /**
   * Get all loot bags for a specific map
   */
  getLootBagsByMap(map) {
    const bags = [];
    for (const lootBag of this.lootBags.values()) {
      if (lootBag.map === map) {
        bags.push(lootBag);
      }
    }
    return bags;
  }

  /**
   * Remove an item from a loot bag
   * Returns the removed item or null if not found
   */
  removeItemFromLootBag(lootBagId, instanceId) {
    const lootBag = this.lootBags.get(lootBagId);
    if (!lootBag) {
      console.warn(`[LootBagManager] Loot bag ${lootBagId} not found`);
      return null;
    }

    const removedItem = lootBag.removeItem(instanceId);

    // If loot bag is empty, despawn it
    if (lootBag.isEmpty()) {
      this.despawnLootBag(lootBagId);
    }

    return removedItem;
  }

  /**
   * Despawn a loot bag
   */
  despawnLootBag(lootBagId) {
    const lootBag = this.lootBags.get(lootBagId);
    if (lootBag) {
      this.lootBags.delete(lootBagId);
      return lootBag;
    }
    return null;
  }

  /**
   * Check for loot bags that should despawn (called by game loop)
   */
  checkDespawns() {
    const despawned = [];

    for (const [id, lootBag] of this.lootBags.entries()) {
      if (lootBag.shouldDespawn()) {
        this.lootBags.delete(id);
        despawned.push(lootBag);
      }
    }

    return despawned;
  }

  /**
   * Get total number of loot bags
   */
  getLootBagCount() {
    return this.lootBags.size;
  }
}

export default LootBagManager;
