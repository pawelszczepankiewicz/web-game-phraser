import { getItem, createItemInstance } from "../../../shared/data/Items.js";
import { MAX_BACKPACK_SLOTS, GOLD_MAX_STACK } from "../../../shared/constants.js";

/**
 * InventoryManager - Server-side inventory validation and operations
 * All item operations must go through this manager
 */
export class InventoryManager {
  constructor(playerManager) {
    this.playerManager = playerManager;
  }

  /**
   * Validate and add item to player's inventory
   * @param {Player} player - The player
   * @param {Object} item - Item to add (itemId, quantity)
   * @returns {Object} Result with success flag and item data
   */
  addItemToPlayer(player, item) {
    if (!player || !item || !item.itemId) {
      return { success: false, reason: "invalid_params" };
    }

    // Get item data to validate it exists
    const itemData = getItem(item.itemId);
    if (!itemData) {
      return { success: false, reason: "invalid_item" };
    }

    const quantity = item.quantity || 1;
    const backpack = player.inventory.backpack;

    // Handle gold specially
    if (item.itemId === "gold") {
      return this.addGold(player, quantity);
    }

    // For stackable items, try to add to existing stack
    if (itemData.stackable) {
      const existingSlot = backpack.find(
        (slot) => slot && slot.itemId === item.itemId && slot.quantity < (itemData.maxStack || 99)
      );

      if (existingSlot) {
        const maxAdd = (itemData.maxStack || 99) - existingSlot.quantity;
        const toAdd = Math.min(quantity, maxAdd);
        existingSlot.quantity += toAdd;

        // If we couldn't add all, try to create new stack
        if (toAdd < quantity) {
          return this.addNewItemStack(player, item.itemId, quantity - toAdd, itemData);
        }

        return { success: true, item: existingSlot };
      }
    }

    // Add as new stack
    return this.addNewItemStack(player, item.itemId, quantity, itemData);
  }

  /**
   * Add a new item stack to backpack
   */
  addNewItemStack(player, itemId, quantity, itemData) {
    const backpack = player.inventory.backpack;

    // Check backpack space
    if (backpack.length >= MAX_BACKPACK_SLOTS) {
      return { success: false, reason: "backpack_full" };
    }

    // Create item instance
    const newItem = createItemInstance(itemId, quantity);
    if (!newItem) {
      return { success: false, reason: "failed_to_create_item" };
    }

    backpack.push(newItem);
    return { success: true, item: newItem };
  }

  /**
   * Add gold to player
   */
  addGold(player, amount) {
    const backpack = player.inventory.backpack;

    // Find existing gold stack with room
    let existingGold = backpack.find(
      (slot) => slot && slot.itemId === "gold" && slot.quantity < GOLD_MAX_STACK
    );

    let remaining = amount;

    while (remaining > 0) {
      if (existingGold) {
        const canAdd = GOLD_MAX_STACK - existingGold.quantity;
        const toAdd = Math.min(remaining, canAdd);
        existingGold.quantity += toAdd;
        remaining -= toAdd;
        existingGold = null; // Find another stack for remaining
      }

      if (remaining > 0) {
        // Need new stack
        if (backpack.length >= MAX_BACKPACK_SLOTS) {
          return { success: false, reason: "backpack_full", added: amount - remaining };
        }

        const newGold = createItemInstance("gold", Math.min(remaining, GOLD_MAX_STACK));
        backpack.push(newGold);
        remaining -= newGold.quantity;

        // Find this stack for potential further additions
        existingGold = newGold.quantity < GOLD_MAX_STACK ? newGold : null;
      }
    }

    return { success: true, added: amount };
  }

  /**
   * Remove item from player's inventory
   * @param {Player} player - The player
   * @param {string} instanceId - Item instance ID to remove
   * @returns {Object} Result with removed item
   */
  removeItemFromPlayer(player, instanceId) {
    if (!player || !instanceId) {
      return { success: false, reason: "invalid_params" };
    }

    const backpack = player.inventory.backpack;
    const index = backpack.findIndex((item) => item && item.instanceId === instanceId);

    if (index === -1) {
      return { success: false, reason: "item_not_found" };
    }

    const removedItem = backpack.splice(index, 1)[0];
    return { success: true, item: removedItem };
  }

  /**
   * Equip item from backpack
   * @param {Player} player - The player
   * @param {string} instanceId - Item instance ID to equip
   * @returns {Object} Result
   */
  equipItem(player, instanceId) {
    if (!player || !instanceId) {
      return { success: false, reason: "invalid_params" };
    }

    const backpack = player.inventory.backpack;
    const itemIndex = backpack.findIndex((item) => item && item.instanceId === instanceId);

    if (itemIndex === -1) {
      return { success: false, reason: "item_not_found" };
    }

    const item = backpack[itemIndex];
    const itemData = getItem(item.itemId);

    if (!itemData || !itemData.wearable || !itemData.slot) {
      return { success: false, reason: "item_not_equippable" };
    }

    const slot = itemData.slot;
    const equipped = player.inventory.equipped;

    // If something is already equipped in that slot, unequip it first
    if (equipped[slot]) {
      const unequipResult = this.unequipItem(player, slot);
      if (!unequipResult.success) {
        return { success: false, reason: "failed_to_unequip" };
      }
    }

    // Remove from backpack and add to equipped
    backpack.splice(itemIndex, 1);
    equipped[slot] = item;

    // Apply stat bonuses
    if (itemData.stats) {
      this.applyItemStats(player, itemData.stats, true);
    }

    return { success: true, slot, item };
  }

  /**
   * Unequip item from slot
   * @param {Player} player - The player
   * @param {string} slot - Equipment slot
   * @returns {Object} Result
   */
  unequipItem(player, slot) {
    if (!player || !slot) {
      return { success: false, reason: "invalid_params" };
    }

    const equipped = player.inventory.equipped;
    const item = equipped[slot];

    if (!item) {
      return { success: false, reason: "slot_empty" };
    }

    // Check backpack space
    if (player.inventory.backpack.length >= MAX_BACKPACK_SLOTS) {
      return { success: false, reason: "backpack_full" };
    }

    // Remove stat bonuses
    const itemData = getItem(item.itemId);
    if (itemData && itemData.stats) {
      this.applyItemStats(player, itemData.stats, false);
    }

    // Move to backpack
    player.inventory.backpack.push(item);
    equipped[slot] = null;

    return { success: true, item };
  }

  /**
   * Apply or remove item stat bonuses
   */
  applyItemStats(player, stats, apply) {
    const multiplier = apply ? 1 : -1;

    if (stats.attackStrength) {
      player.stats.attackStrength += stats.attackStrength * multiplier;
    }
    if (stats.armor) {
      player.stats.armor += stats.armor * multiplier;
    }
    if (stats.maxHealth) {
      player.stats.maxHealth += stats.maxHealth * multiplier;
      // Clamp current health to max
      if (player.stats.health > player.stats.maxHealth) {
        player.stats.health = player.stats.maxHealth;
      }
    }
  }

  /**
   * Use a consumable item
   * @param {Player} player - The player
   * @param {string} instanceId - Item instance ID to use
   * @returns {Object} Result
   */
  useItem(player, instanceId) {
    if (!player || !instanceId) {
      return { success: false, reason: "invalid_params" };
    }

    const backpack = player.inventory.backpack;
    const itemIndex = backpack.findIndex((item) => item && item.instanceId === instanceId);

    if (itemIndex === -1) {
      return { success: false, reason: "item_not_found" };
    }

    const item = backpack[itemIndex];
    const itemData = getItem(item.itemId);

    if (!itemData || !itemData.effects) {
      return { success: false, reason: "item_not_usable" };
    }

    // Apply effects
    const effects = itemData.effects;
    if (effects.heal) {
      const healed = player.heal(effects.heal);
      console.log(`[InventoryManager] ${player.name} healed for ${healed}`);
    }

    // Reduce quantity or remove
    item.quantity -= 1;
    if (item.quantity <= 0) {
      backpack.splice(itemIndex, 1);
    }

    return { success: true, effects: itemData.effects };
  }

  /**
   * Validate that player has enough gold
   */
  hasGold(player, amount) {
    const totalGold = player.inventory.backpack
      .filter((item) => item && item.itemId === "gold")
      .reduce((sum, item) => sum + item.quantity, 0);

    return totalGold >= amount;
  }

  /**
   * Remove gold from player
   */
  removeGold(player, amount) {
    if (!this.hasGold(player, amount)) {
      return { success: false, reason: "insufficient_gold" };
    }

    let remaining = amount;
    const backpack = player.inventory.backpack;

    // Remove from gold stacks
    for (let i = backpack.length - 1; i >= 0 && remaining > 0; i--) {
      const item = backpack[i];
      if (item && item.itemId === "gold") {
        if (item.quantity <= remaining) {
          remaining -= item.quantity;
          backpack.splice(i, 1);
        } else {
          item.quantity -= remaining;
          remaining = 0;
        }
      }
    }

    return { success: true, removed: amount };
  }

  /**
   * Get total gold count
   */
  getGoldCount(player) {
    return player.inventory.backpack
      .filter((item) => item && item.itemId === "gold")
      .reduce((sum, item) => sum + item.quantity, 0);
  }
}
