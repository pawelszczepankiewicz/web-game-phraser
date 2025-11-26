/**
 * Loot tables for containers (chests, barrels, crates, etc.)
 *
 * ⚠️ WARNING: This is a CLIENT-SIDE COPY for rendering purposes only.
 * The SERVER is the authoritative source for all loot drop rates.
 * Server: /server/src/data/LootTables.js
 *
 * TODO: Refactor to fetch loot data from server instead of using local copy.
 *
 * NOTE: Monster loot is now defined in src/data/Monsters.js
 *
 * Container loot format:
 * {
 *   itemId: 'item_key',
 *   dropRate: 0.5,           // 0-1 probability (0.5 = 50% chance)
 *   minQuantity: 1,          // Min items (optional)
 *   maxQuantity: 5,          // Max items (optional)
 *   quantity: 1              // Fixed quantity (if not using min/max)
 * }
 */

export const CONTAINER_LOOT_TABLES = {
  // Example: Wooden chest (common loot)
  chest_wooden: [
    { itemId: "gold", dropRate: 1.0, minQuantity: 10, maxQuantity: 50 },
    { itemId: "health_potion", dropRate: 0.3, quantity: 1 },
    { itemId: "equipment_helmet_leather", dropRate: 0.1, quantity: 1 },
  ],

  // Example: Metal chest (rare loot)
  chest_metal: [
    { itemId: "gold", dropRate: 1.0, minQuantity: 50, maxQuantity: 200 },
    { itemId: "health_potion", dropRate: 0.5, quantity: 2 },
    { itemId: "equipment_armor_leather", dropRate: 0.2, quantity: 1 },
    { itemId: "weapon_wood_club", dropRate: 0.15, quantity: 1 },
  ],

  // Example: Barrel (low-tier loot)
  barrel: [
    { itemId: "gold", dropRate: 0.8, minQuantity: 1, maxQuantity: 10 },
    { itemId: "health_potion", dropRate: 0.1, quantity: 1 },
  ],

  // Add more container types as needed
};

/**
 * Get loot table for a container type
 */
export function getContainerLootTable(containerType) {
  return CONTAINER_LOOT_TABLES[containerType] || [];
}

/**
 * Roll for loot drops from a container
 * Returns array of {itemId, quantity}
 */
export function rollContainerLoot(containerType) {
  const lootTable = getContainerLootTable(containerType);

  const drops = [];

  lootTable.forEach((entry) => {
    // Roll for drop chance
    const roll = Math.random();

    if (roll <= entry.dropRate) {
      // Handle items with quantity range (minQuantity/maxQuantity)
      let quantity;
      if (entry.minQuantity !== undefined && entry.maxQuantity !== undefined) {
        quantity = Math.floor(
          Math.random() * (entry.maxQuantity - entry.minQuantity + 1) + entry.minQuantity
        );
      } else {
        // Fixed quantity
        quantity = entry.quantity || 1;
      }

      drops.push({
        itemId: entry.itemId,
        quantity: quantity,
      });
    }
  });

  return drops;
}
