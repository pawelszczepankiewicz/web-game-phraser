/**
 * Loot tables for props/containers (chests, barrels, crates, etc.)
 *
 * NOTE: Monster loot is defined in src/data/Monsters.js
 *
 * Prop loot format:
 * {
 *   itemId: 'item_key',
 *   dropRate: 0.5,           // 0-1 probability (0.5 = 50% chance)
 *   minQuantity: 1,          // Min items (optional)
 *   maxQuantity: 5,          // Max items (optional)
 *   quantity: 1              // Fixed quantity (if not using min/max)
 * }
 *
 * Usage: Add "lootType" property to prop tiles in Tiled
 * e.g., lootType: "barrel" will use the barrel loot table
 */

export const PROP_LOOT_TABLES = {
  // Barrel - common low-tier loot
  barrel: [
    { itemId: "gold", dropRate: 0.8, minQuantity: 1, maxQuantity: 10 },
    { itemId: "potion_health", dropRate: 0.15, quantity: 1 },
  ],

  // Crate - slightly better than barrel
  crate: [
    { itemId: "gold", dropRate: 0.9, minQuantity: 5, maxQuantity: 20 },
    { itemId: "potion_health", dropRate: 0.25, quantity: 1 },
    { itemId: "boots_leather", dropRate: 0.05, quantity: 1 },
  ],

  // Pot - very low-tier, mostly empty
  pot: [
    { itemId: "gold", dropRate: 0.6, minQuantity: 1, maxQuantity: 5 },
    { itemId: "potion_health", dropRate: 0.1, quantity: 1 },
  ],

  // Sack - moderate loot
  sack: [
    { itemId: "gold", dropRate: 0.85, minQuantity: 3, maxQuantity: 15 },
    { itemId: "potion_health", dropRate: 0.2, quantity: 1 },
  ],

  // Wooden chest - common chest loot
  chest: [
    { itemId: "gold", dropRate: 1.0, minQuantity: 15, maxQuantity: 40 },
    { itemId: "potion_health", dropRate: 0.35, quantity: 1 },
    { itemId: "helmet_leather", dropRate: 0.12, quantity: 1 },
    { itemId: "armor_leather", dropRate: 0.1, quantity: 1 },
    { itemId: "weapon_wood_club", dropRate: 0.08, quantity: 1 },
    { itemId: "shield_wood", dropRate: 0.06, quantity: 1 },
  ],

  // Iron chest - better loot
  chest_iron: [
    { itemId: "gold", dropRate: 1.0, minQuantity: 40, maxQuantity: 100 },
    { itemId: "potion_health", dropRate: 0.5, quantity: 2 },
    { itemId: "helmet_iron", dropRate: 0.18, quantity: 1 },
    { itemId: "armor_iron", dropRate: 0.15, quantity: 1 },
    { itemId: "weapon_iron_sword", dropRate: 0.12, quantity: 1 },
    { itemId: "shield_iron", dropRate: 0.1, quantity: 1 },
    { itemId: "ring_defense", dropRate: 0.06, quantity: 1 },
  ],

  // Treasure chest - rare loot
  treasure: [
    { itemId: "gold", dropRate: 1.0, minQuantity: 80, maxQuantity: 200 },
    { itemId: "potion_health", dropRate: 0.7, quantity: 3 },
    { itemId: "helmet_steel", dropRate: 0.2, quantity: 1 },
    { itemId: "armor_steel", dropRate: 0.18, quantity: 1 },
    { itemId: "boots_iron", dropRate: 0.15, quantity: 1 },
    { itemId: "weapon_steel_sword", dropRate: 0.15, quantity: 1 },
    { itemId: "shield_steel", dropRate: 0.12, quantity: 1 },
    { itemId: "ring_strength", dropRate: 0.1, quantity: 1 },
    { itemId: "amulet_basic", dropRate: 0.08, quantity: 1 },
  ],
};

/**
 * Get loot table for a prop type
 * @param {string} lootType - The loot type (barrel, crate, chest, etc.)
 * @returns {Array} The loot table array or empty array if not found
 */
export function getPropLootTable(lootType) {
  return PROP_LOOT_TABLES[lootType] || [];
}

/**
 * Roll for loot drops from a prop
 * @param {string} lootType - The loot type (barrel, crate, chest, etc.)
 * @returns {Array} Array of { itemId, quantity, instanceId }
 */
export function rollPropLoot(lootType) {
  const lootTable = getPropLootTable(lootType);
  const drops = [];

  lootTable.forEach((entry) => {
    const roll = Math.random();

    if (roll <= entry.dropRate) {
      let quantity;
      if (entry.minQuantity !== undefined && entry.maxQuantity !== undefined) {
        quantity = Math.floor(
          Math.random() * (entry.maxQuantity - entry.minQuantity + 1) + entry.minQuantity
        );
      } else {
        quantity = entry.quantity || 1;
      }

      drops.push({
        itemId: entry.itemId,
        quantity: quantity,
        instanceId: `${entry.itemId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      });
    }
  });

  return drops;
}
