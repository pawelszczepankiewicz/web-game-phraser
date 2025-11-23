/**
 * LootBag - Server-side loot bag state
 */
class LootBag {
  constructor(id, x, y, items, map) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.items = items; // Array of {itemId, quantity, instanceId}
    this.map = map;
    this.createdAt = Date.now();
    this.despawnTime = 60000; // 60 seconds
  }

  /**
   * Remove an item from the loot bag
   */
  removeItem(instanceId) {
    const index = this.items.findIndex(item => item.instanceId === instanceId);
    if (index > -1) {
      const removedItem = this.items.splice(index, 1)[0];
      console.log(`[LootBag ${this.id}] Item removed: ${removedItem.itemId} (${instanceId})`);
      return removedItem;
    }
    return null;
  }

  /**
   * Check if loot bag is empty
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Check if loot bag should despawn
   */
  shouldDespawn() {
    return Date.now() - this.createdAt >= this.despawnTime;
  }

  /**
   * Get state for broadcasting to clients
   */
  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      items: this.items,
      map: this.map,
      createdAt: this.createdAt,
      despawnTime: this.despawnTime
    };
  }
}

module.exports = LootBag;
