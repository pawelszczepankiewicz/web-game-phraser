import { getItem, createItemInstance } from '../data/Items.js';

/**
 * InventorySystem - Manages player inventory and equipment
 */
export class InventorySystem {
  constructor(scene, initialInventory) {
    this.scene = scene;
    this.maxBackpackSlots = 40;

    this.backpack = initialInventory?.backpack || [];
    this.equipped = {
      helmet: null,
      armor: null,
      weapon: null,
      shield: null,
      // Extensible for future equipment slots:
      // belt: null,
      // ring1: null,
      // ring2: null,
      // amulet: null,
      ...initialInventory?.equipped
    };

    // Listeners for inventory changes
    this.listeners = [];
  }

  /**
   * Add item to backpack
   */
  addItem(itemIdOrInstance, quantity = 1) {
    let item;

    if (typeof itemIdOrInstance === 'string') {
      item = createItemInstance(itemIdOrInstance, quantity);
    } else {
      item = itemIdOrInstance;
    }

    if (!item) {
      console.error('Invalid item');
      return false;
    }

    // Check if item is stackable
    if (item.stackable) {
      const existingItem = this.backpack.find(i => i.itemId === item.itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
        this.notifyListeners('add', item);
        return true;
      }
    }

    // Check if backpack is full
    if (this.backpack.length >= this.maxBackpackSlots) {
      console.log('Backpack is full!');
      return false;
    }

    // Add item to backpack
    this.backpack.push(item);
    this.notifyListeners('add', item);
    return true;
  }

  /**
   * Remove item from backpack
   */
  removeItem(instanceId, quantity = 1) {
    const index = this.backpack.findIndex(i => i.instanceId === instanceId);
    if (index === -1) return false;

    const item = this.backpack[index];

    if (item.stackable && item.quantity > quantity) {
      item.quantity -= quantity;
      this.notifyListeners('remove', item);
      return true;
    }

    // Remove entire stack or non-stackable item
    this.backpack.splice(index, 1);
    this.notifyListeners('remove', item);
    return true;
  }

  /**
   * Equip item from backpack
   */
  equipItem(instanceId) {
    const index = this.backpack.findIndex(i => i.instanceId === instanceId);
    if (index === -1) return false;

    const item = this.backpack[index];

    if (!item.wearable || !item.slot) {
      console.log('Item cannot be equipped');
      return false;
    }

    // Unequip current item in slot if any
    if (this.equipped[item.slot]) {
      this.unequipItem(item.slot);
    }

    // Remove from backpack
    this.backpack.splice(index, 1);

    // Equip item
    this.equipped[item.slot] = item;

    // Apply item stats
    this.applyItemStats(item, true);

    // Update player sprite
    if (this.scene.player) {
      this.scene.player.equipItem(item.slot, item.sprite);
    }

    this.notifyListeners('equip', item);
    return true;
  }

  /**
   * Unequip item to backpack
   */
  unequipItem(slot) {
    const item = this.equipped[slot];
    if (!item) return false;

    // Check if backpack has space
    if (this.backpack.length >= this.maxBackpackSlots) {
      console.log('Backpack is full!');
      return false;
    }

    // Remove from equipped
    this.equipped[slot] = null;

    // Remove item stats
    this.applyItemStats(item, false);

    // Add to backpack
    this.backpack.push(item);

    // Update player sprite
    if (this.scene.player) {
      this.scene.player.equipItem(slot, null);
    }

    this.notifyListeners('unequip', item);
    return true;
  }

  /**
   * Use a consumable item
   */
  useItem(instanceId) {
    const index = this.backpack.findIndex(i => i.instanceId === instanceId);
    if (index === -1) return false;

    const item = this.backpack[index];

    if (item.type !== 'consumable') {
      console.log('Item is not consumable');
      return false;
    }

    // Apply item effects
    this.applyItemEffects(item);

    // Remove one from stack or remove item entirely
    this.removeItem(instanceId, 1);

    this.notifyListeners('use', item);
    console.log(`Used ${item.name}`);
    return true;
  }

  /**
   * Apply item effects (for consumables)
   */
  applyItemEffects(item) {
    if (!item.effects || item.effects.length === 0) return;

    item.effects.forEach(effect => {
      switch (effect.type) {
        case 'heal':
          if (this.scene.statsSystem) {
            this.scene.statsSystem.heal(effect.value);
            console.log(`Healed for ${effect.value} health`);
          }
          break;
        case 'damage':
          // Could be used for poison or harmful consumables
          if (this.scene.statsSystem) {
            this.scene.statsSystem.takeDamage(effect.value);
          }
          break;
        // Add more effect types as needed
        default:
          console.log(`Unknown effect type: ${effect.type}`);
      }
    });
  }

  /**
   * Apply or remove item stats
   */
  applyItemStats(item, apply) {
    if (!this.scene.statsSystem) return;

    const multiplier = apply ? 1 : -1;

    Object.entries(item.stats).forEach(([stat, value]) => {
      this.scene.statsSystem.modifyStat(stat, value * multiplier);
    });
  }

  /**
   * Get all items in backpack
   */
  getBackpack() {
    return [...this.backpack];
  }

  /**
   * Get equipped items
   */
  getEquipped() {
    return { ...this.equipped };
  }

  /**
   * Add listener for inventory changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners of inventory change
   */
  notifyListeners(action, item) {
    this.listeners.forEach(callback => {
      callback(action, item);
    });
  }

  /**
   * Export inventory for saving
   */
  exportInventory() {
    return {
      backpack: this.backpack,
      equipped: this.equipped
    };
  }

  /**
   * Import inventory from save data
   */
  importInventory(inventory) {
    this.backpack = inventory.backpack || [];
    this.equipped = inventory.equipped || {
      helmet: null,
      armor: null,
      weapon: null,
      shield: null
    };
    this.notifyListeners('import', null);
  }
}
