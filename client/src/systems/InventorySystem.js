import { createItemInstance, getItem } from "../../../shared/data/Items.js";

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
      ...initialInventory?.equipped,
    };

    // Note: Gold is stored as items in backpack with id='gold', not as separate property
    // Legacy migration: Convert old gold property to gold items
    if (initialInventory?.gold && initialInventory.gold > 0) {
      const hasGoldItems = this.backpack.some((item) => item?.itemId === "gold");
      if (!hasGoldItems) {
        // Will be added via addGold after initialization
        setTimeout(() => this.addGold(initialInventory.gold), 0);
      }
    }

    // Listeners for inventory changes
    this.listeners = [];
  }

  /**
   * Check if there's space in backpack for an item
   */
  hasSpace(itemIdOrInstance, quantity = 1) {
    let item;

    if (typeof itemIdOrInstance === "string") {
      item = createItemInstance(itemIdOrInstance, quantity);
    } else {
      item = itemIdOrInstance;
    }

    if (!item) {
      return false;
    }

    // Special handling for gold
    if (item.itemId === "gold") {
      // Gold can always be added up to Number.MAX_SAFE_INTEGER
      return true;
    }

    // Check if item is stackable
    if (item.stackable) {
      let remaining = quantity;

      // Check existing stacks first
      for (const existingItem of this.backpack) {
        if (existingItem.itemId === item.itemId && existingItem.quantity < existingItem.maxStack) {
          const canAdd = Math.min(remaining, existingItem.maxStack - existingItem.quantity);
          remaining -= canAdd;

          if (remaining <= 0) {
            return true;
          }
        }
      }

      // Calculate how many new slots we'd need
      const slotsNeeded = Math.ceil(remaining / item.maxStack);
      const freeSlots = this.maxBackpackSlots - this.backpack.length;

      return slotsNeeded <= freeSlots;
    } else {
      // Non-stackable item needs one slot
      return this.backpack.length < this.maxBackpackSlots;
    }
  }

  /**
   * Add item to backpack
   */
  addItem(itemIdOrInstance, quantity = 1) {
    let item;

    if (typeof itemIdOrInstance === "string") {
      item = createItemInstance(itemIdOrInstance, quantity);
    } else {
      item = itemIdOrInstance;
    }

    if (!item) {
      console.error("Invalid item");
      return false;
    }

    // Special handling for gold - use addGold to respect stack limits
    if (item.itemId === "gold") {
      return this.addGold(quantity);
    }

    // Check if item is stackable
    if (item.stackable) {
      let remaining = quantity;

      // Try to add to existing stacks first (respecting maxStack)
      for (const existingItem of this.backpack) {
        if (existingItem.itemId === item.itemId && existingItem.quantity < existingItem.maxStack) {
          const canAdd = Math.min(remaining, existingItem.maxStack - existingItem.quantity);
          existingItem.quantity += canAdd;
          remaining -= canAdd;

          if (remaining <= 0) {
            this.notifyListeners("add", item);
            return true;
          }
        }
      }

      // Need to create new stacks for remaining quantity
      while (remaining > 0) {
        // Check if backpack has space
        if (this.backpack.length >= this.maxBackpackSlots) {
          return false;
        }

        // Create new stack
        const stackAmount = Math.min(remaining, item.maxStack);
        const newItem = createItemInstance(item.itemId, stackAmount);
        this.backpack.push(newItem);
        remaining -= stackAmount;
      }

      this.notifyListeners("add", item);
      return true;
    }

    // Non-stackable item
    // Check if backpack is full
    if (this.backpack.length >= this.maxBackpackSlots) {
      return false;
    }

    // Add item to backpack
    this.backpack.push(item);
    this.notifyListeners("add", item);
    return true;
  }

  /**
   * Remove item from backpack
   */
  removeItem(instanceId, quantity = 1) {
    const index = this.backpack.findIndex((i) => i.instanceId === instanceId);
    if (index === -1) return false;

    const item = this.backpack[index];

    if (item.stackable && item.quantity > quantity) {
      item.quantity -= quantity;
      this.notifyListeners("remove", item);
      return true;
    }

    // Remove entire stack or non-stackable item
    this.backpack.splice(index, 1);
    this.notifyListeners("remove", item);
    return true;
  }

  /**
   * Get item by instance ID
   */
  getItemByInstanceId(instanceId) {
    return this.backpack.find((i) => i.instanceId === instanceId) || null;
  }

  /**
   * Equip item from backpack
   */
  equipItem(instanceId) {
    const index = this.backpack.findIndex((i) => i.instanceId === instanceId);
    if (index === -1) return false;

    const item = this.backpack[index];

    if (!item.wearable || !item.slot) {
      return false;
    }

    // Handle ring slot - find available ring_left or ring_right
    let targetSlot = item.slot;
    if (item.slot === "ring") {
      if (!this.equipped.ring_left) {
        targetSlot = "ring_left";
      } else if (!this.equipped.ring_right) {
        targetSlot = "ring_right";
      } else {
        return false;
      }
    }

    // Unequip current item in slot if any
    if (this.equipped[targetSlot]) {
      this.unequipItem(targetSlot);
    }

    // Remove from backpack
    this.backpack.splice(index, 1);

    // Equip item
    this.equipped[targetSlot] = item;

    // Apply item stats
    this.applyItemStats(item, true);

    // Update player sprite (only if item is visible on character)
    // Use current item definition for visual properties so updates to Items.js take effect
    if (this.scene.player && item.visible) {
      const itemDef = getItem(item.itemId);
      const animatedSprite = itemDef?.animatedSprite ?? item.animatedSprite;
      const staticWearableSprite = itemDef?.staticWearableSprite ?? item.staticWearableSprite;
      this.scene.player.equipItem(targetSlot, animatedSprite, staticWearableSprite);
    }

    // If equipping a weapon, update player's weapon data for attack range/cooldown
    if (targetSlot === "weapon" && this.scene.player) {
      this.scene.player.setEquippedWeapon(item);
    }

    this.notifyListeners("equip", item);
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

    // If unequipping a weapon, clear player's weapon data
    if (slot === "weapon" && this.scene.player) {
      this.scene.player.setEquippedWeapon(null);
    }

    this.notifyListeners("unequip", item);
    return true;
  }

  /**
   * Use a consumable item
   */
  useItem(instanceId) {
    const index = this.backpack.findIndex((i) => i.instanceId === instanceId);
    if (index === -1) return false;

    const item = this.backpack[index];

    if (item.type !== "consumable") {
      return false;
    }

    // Apply item effects
    this.applyItemEffects(item);

    // Remove one from stack or remove item entirely
    this.removeItem(instanceId, 1);

    this.notifyListeners("use", item);
    return true;
  }

  /**
   * Apply item effects (for consumables)
   */
  applyItemEffects(item) {
    if (!item.effects || item.effects.length === 0) return;

    item.effects.forEach((effect) => {
      switch (effect.type) {
        case "heal":
          if (this.scene.statsSystem) {
            this.scene.statsSystem.heal(effect.value);
          }
          break;
        case "damage":
          // Could be used for poison or harmful consumables
          if (this.scene.statsSystem) {
            this.scene.statsSystem.takeDamage(effect.value);
          }
          break;
        // Add more effect types as needed
        default:
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
   * Get total gold amount from backpack
   */
  getGold() {
    return this.backpack
      .filter((item) => item.itemId === "gold")
      .reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Add gold to backpack (respects stack size of 1000)
   * Returns true if successful, false if backpack full
   */
  addGold(amount) {
    let remaining = amount;

    // Try to add to existing gold stacks first
    for (const item of this.backpack) {
      if (item.itemId === "gold" && item.quantity < 1000) {
        const canAdd = Math.min(remaining, 1000 - item.quantity);
        item.quantity += canAdd;
        remaining -= canAdd;

        if (remaining <= 0) {
          this.notifyListeners("gold", { amount: this.getGold() });
          return true;
        }
      }
    }

    // Need to create new gold stacks
    while (remaining > 0) {
      // Check if backpack has space
      if (this.backpack.length >= this.maxBackpackSlots) {
        this.notifyListeners("gold", { amount: this.getGold() });
        return false; // Backpack full
      }

      const stackAmount = Math.min(remaining, 1000);
      // Create gold item directly to avoid recursion
      const newGoldItem = createItemInstance("gold", stackAmount);
      this.backpack.push(newGoldItem);
      remaining -= stackAmount;
    }

    this.notifyListeners("gold", { amount: this.getGold() });
    return true;
  }

  /**
   * Remove gold from backpack
   * Returns true if successful, false if not enough gold
   */
  removeGold(amount) {
    const currentGold = this.getGold();

    if (currentGold < amount) {
      return false;
    }

    let remaining = amount;

    // Remove from gold stacks (start from the end to avoid index issues)
    for (let i = this.backpack.length - 1; i >= 0 && remaining > 0; i--) {
      const item = this.backpack[i];

      if (item.itemId === "gold") {
        const removeAmount = Math.min(remaining, item.quantity);
        item.quantity -= removeAmount;
        remaining -= removeAmount;

        // Remove empty gold stacks
        if (item.quantity <= 0) {
          this.backpack.splice(i, 1);
        }
      }
    }

    this.notifyListeners("gold", { amount: this.getGold() });
    return true;
  }

  /**
   * Buy item from trader
   */
  buyItem(itemId, price) {
    // Check if player has enough gold
    const currentGold = this.getGold();
    if (currentGold < price) {
      return { success: false, reason: "insufficient_gold" };
    }

    // Check if backpack has space for the item
    if (this.backpack.length >= this.maxBackpackSlots) {
      return { success: false, reason: "backpack_full" };
    }

    // Remove gold first
    if (!this.removeGold(price)) {
      return { success: false, reason: "insufficient_gold" };
    }

    // Add item to backpack
    const success = this.addItem(itemId);
    if (!success) {
      // Refund gold if couldn't add item (shouldn't happen since we checked space)
      this.addGold(price);
      return { success: false, reason: "add_item_failed" };
    }

    return { success: true };
  }

  /**
   * Sell item to trader
   */
  sellItem(instanceId, price) {
    // Calculate how many gold stacks this would create
    const goldNeeded = price;
    const currentGoldStacks = this.backpack.filter((item) => item.itemId === "gold");
    let availableGoldSpace = 0;

    // Calculate available space in existing gold stacks
    currentGoldStacks.forEach((stack) => {
      availableGoldSpace += 1000 - stack.quantity;
    });

    // Calculate how many new stacks we'd need
    const goldAfterExistingStacks = Math.max(0, goldNeeded - availableGoldSpace);
    const newStacksNeeded = Math.ceil(goldAfterExistingStacks / 1000);

    // Calculate available empty slots (excluding the item we're selling)
    const emptySlots = this.maxBackpackSlots - this.backpack.length + 1; // +1 because we're removing the sold item

    if (newStacksNeeded > emptySlots) {
      return { success: false, reason: "insufficient_space" };
    }

    // Remove item from inventory
    const itemRemoved = this.removeItem(instanceId);
    if (!itemRemoved) {
      return { success: false, reason: "item_not_found" };
    }

    // Add gold (now we have space since we removed the item)
    const goldAdded = this.addGold(price);
    if (!goldAdded) {
      // This shouldn't happen since we pre-checked, but just in case
      // Try to add the item back
      console.error(`Failed to add gold after selling! This shouldn't happen.`);
      return { success: false, reason: "add_gold_failed" };
    }

    return { success: true };
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
    this.listeners.forEach((callback) => {
      callback(action, item);
    });
  }

  /**
   * Export inventory for saving
   * Note: Gold is stored as items in backpack, not as separate property
   */
  exportInventory() {
    return {
      backpack: this.backpack,
      equipped: this.equipped,
      gold: this.getGold(), // Computed from backpack items for backward compatibility
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
      shield: null,
    };

    // Legacy: Convert old gold property to gold items if needed
    if (inventory.gold && inventory.gold > 0) {
      const hasGoldItems = this.backpack.some((item) => item?.itemId === "gold");
      if (!hasGoldItems) {
        this.addGold(inventory.gold);
      }
    }

    this.notifyListeners("import", null);
  }
}
