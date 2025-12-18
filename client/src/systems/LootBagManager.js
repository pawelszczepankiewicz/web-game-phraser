import { LootBag } from "../entities/LootBag.js";
import { createItemInstance } from "../shared/data/Items.js";

/**
 * LootBagManager - Handles creation and management of loot bags
 */
export class LootBagManager {
  constructor(scene) {
    this.scene = scene;
    this.lootBags = new Map();
    this.nextId = 1;
  }

  /**
   * Create a loot bag at position with items
   * @param {Object|number} config - Config object { x, y, items, createdAt } or x position (legacy)
   * @param {number} [y] - Y position (legacy)
   * @param {Array} [itemDrops] - Item drops (legacy)
   */
  createLootBag(config, y, itemDrops) {
    // Support both new object format and legacy positional args
    let x, items, createdAt;
    if (typeof config === "object" && config !== null && "items" in config) {
      x = config.x;
      y = config.y;
      itemDrops = config.items;
      createdAt = config.createdAt || Date.now();
    } else {
      x = config;
      createdAt = Date.now();
    }

    const itemInstances = itemDrops
      .map((drop) => {
        return createItemInstance(drop.itemId, drop.quantity);
      })
      .filter((item) => item !== null);

    if (itemInstances.length === 0) {
      return null;
    }

    const id = `client_lootbag_${this.nextId++}`;
    const lootBag = new LootBag(this.scene, x, y, itemInstances);
    lootBag.id = id;
    lootBag.createdAt = createdAt;
    this.lootBags.set(id, lootBag);

    return lootBag;
  }

  /**
   * Get all loot bags
   * @returns {Array<LootBag>}
   */
  getLootBags() {
    return Array.from(this.lootBags.values());
  }

  /**
   * Remove a loot bag from management
   * @param {LootBag|string} lootBagOrId - The loot bag object or its ID
   */
  removeLootBag(lootBagOrId) {
    const id = typeof lootBagOrId === "string" ? lootBagOrId : lootBagOrId?.id;
    if (id) {
      const lootBag = this.lootBags.get(id);
      if (lootBag && lootBag.active) {
        lootBag.despawn();
      }
      this.lootBags.delete(id);
    }
  }

  /**
   * Update all loot bags
   */
  update(time, delta) {
    for (const [id, bag] of this.lootBags.entries()) {
      if (!bag.active) {
        this.lootBags.delete(id);
      } else {
        bag.update(time, delta);
      }
    }
  }

  /**
   * Clear all loot bags
   */
  clear() {
    for (const bag of this.lootBags.values()) {
      if (bag.active) {
        bag.destroy();
      }
    }
    this.lootBags.clear();
  }

  /**
   * Create a loot bag from server data (multiplayer)
   */
  createLootBagFromServer(serverData) {
    const { id, x, y, items } = serverData;

    if (this.lootBags.has(id)) {
      return null;
    }

    // Create item instances but preserve the server's instanceId
    const itemInstances = items
      .map((item) => {
        const instance = createItemInstance(item.itemId, item.quantity);
        if (instance && item.instanceId) {
          // IMPORTANT: Use the server's instanceId, not the newly generated one
          instance.instanceId = item.instanceId;
        }
        return instance;
      })
      .filter((item) => item !== null);

    if (itemInstances.length === 0) {
      return null;
    }

    const lootBag = new LootBag(this.scene, x, y, itemInstances);
    lootBag.id = id;
    lootBag.serverId = id;
    lootBag.isServerManaged = true;

    this.lootBags.set(id, lootBag);

    return lootBag;
  }

  /**
   * Remove an item from a loot bag (from server event)
   */
  removeItemFromLootBag(lootBagId, instanceId) {
    const lootBag = this.lootBags.get(lootBagId);
    if (!lootBag) {
      return;
    }

    lootBag.removeItem(instanceId);
  }

  /**
   * Despawn a loot bag by server ID
   */
  despawnLootBagById(lootBagId) {
    const lootBag = this.lootBags.get(lootBagId);
    if (!lootBag) {
      return;
    }

    this.lootBags.delete(lootBagId);

    if (lootBag.active) {
      lootBag.despawn();
    }
  }
}
