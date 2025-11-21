/**
 * Loot tables for monsters
 * Each entry has: itemId and dropChance (0-1)
 */

export const LOOT_TABLES = {
  slime: [
    { itemId: "gold", dropChance: 1, quantityMin: 1, quantityMax: 5 },
    {
      itemId: "potion_health",
      dropChance: 0.5,
      quantityMin: 1,
      quantityMax: 2,
    },
    {
      itemId: "helmet_leather",
      dropChance: 0.5,
      quantityMin: 1,
      quantityMax: 1,
    },
    {
      itemId: "armor_leather",
      dropChance: 0.5,
      quantityMin: 1,
      quantityMax: 1,
    },
    {
      itemId: "boots_leather",
      dropChance: 0.5,
      quantityMin: 1,
      quantityMax: 1,
    },
    { itemId: "shield_wood", dropChance: 0.5, quantityMin: 1, quantityMax: 1 },
    {
      itemId: "weapon_wood_club",
      dropChance: 0.5,
      quantityMin: 1,
      quantityMax: 1,
    },
    {
      itemId: "amulet_basic",
      dropChance: 0.5,
      quantityMin: 1,
      quantityMax: 1,
    },
  ],
};

/**
 * Get loot table for monster type
 */
export function getLootTable(monsterType) {
  // Normalize monster type by removing "monster_" prefix if present
  const normalizedType = monsterType.startsWith("monster_")
    ? monsterType.substring(8)
    : monsterType;

  return LOOT_TABLES[normalizedType] || [];
}

/**
 * Roll for loot drops from a monster
 * Returns array of {itemId, quantity}
 */
export function rollLoot(monsterType) {
  console.log(`[LootTables] Rolling loot for monster type: "${monsterType}"`);
  const lootTable = getLootTable(monsterType);
  console.log(`[LootTables] Loot table entries:`, lootTable.length);
  console.log(`[LootTables] Available loot tables:`, Object.keys(LOOT_TABLES));

  const drops = [];

  lootTable.forEach((entry) => {
    // Roll for drop chance
    const roll = Math.random();
    console.log(
      `[LootTables] Item ${entry.itemId}: rolled ${roll.toFixed(
        3
      )} vs dropChance ${entry.dropChance}`
    );

    if (roll <= entry.dropChance) {
      const quantity = Math.floor(
        Math.random() * (entry.quantityMax - entry.quantityMin + 1) +
          entry.quantityMin
      );
      drops.push({
        itemId: entry.itemId,
        quantity: quantity,
      });
      console.log(`[LootTables] ✓ Dropped ${quantity}x ${entry.itemId}`);
    } else {
      console.log(`[LootTables] ✗ No drop for ${entry.itemId}`);
    }
  });

  console.log(`[LootTables] Total drops:`, drops);
  return drops;
}
