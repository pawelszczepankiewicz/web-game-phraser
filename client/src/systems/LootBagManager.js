import { LootBag } from '../entities/LootBag.js';
import { createItemInstance } from '../data/Items.js';

/**
 * LootBagManager - Handles creation and management of loot bags
 */
export class LootBagManager {
  constructor(scene) {
    this.scene = scene;
    this.lootBags = [];
  }

  /**
   * Create a loot bag at position with items
   */
  createLootBag(x, y, itemDrops) {
    // Create item instances from drops
    const items = itemDrops.map(drop => {
      return createItemInstance(drop.itemId, drop.quantity);
    }).filter(item => item !== null);

    if (items.length === 0) {
      console.log('No valid items to drop, skipping loot bag');
      return null;
    }

    const lootBag = new LootBag(this.scene, x, y, items);
    this.lootBags.push(lootBag);

    console.log(`Created loot bag at (${x}, ${y}) with ${items.length} items`);
    return lootBag;
  }

  /**
   * Remove a loot bag from management
   */
  removeLootBag(lootBag) {
    const index = this.lootBags.indexOf(lootBag);
    if (index > -1) {
      this.lootBags.splice(index, 1);
    }
  }

  /**
   * Update all loot bags
   */
  update(time, delta) {
    // Clean up destroyed loot bags
    this.lootBags = this.lootBags.filter(bag => bag.active);

    // Update active bags
    this.lootBags.forEach(bag => {
      if (bag.active) {
        bag.update(time, delta);
      }
    });
  }

  /**
   * Clear all loot bags
   */
  clear() {
    this.lootBags.forEach(bag => {
      if (bag.active) {
        bag.destroy();
      }
    });
    this.lootBags = [];
  }
}
