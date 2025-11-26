import { LootBag } from "../entities/LootBag.js";
import { createItemInstance } from "../data/Items.js";

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
   */
  createLootBag(x, y, itemDrops) {
    const items = itemDrops
      .map((drop) => {
        return createItemInstance(drop.itemId, drop.quantity);
      })
      .filter((item) => item !== null);

    if (items.length === 0) {
      return null;
    }

    const id = `client_lootbag_${this.nextId++}`;
    const lootBag = new LootBag(this.scene, x, y, items);
    lootBag.id = id;
    this.lootBags.set(id, lootBag);

    return lootBag;
  }

  /**
   * Remove a loot bag from management
   */
  removeLootBag(lootBag) {
    if (lootBag.id) {
      this.lootBags.delete(lootBag.id);
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

    const itemInstances = items
      .map((item) => {
        return createItemInstance(item.itemId, item.quantity);
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
