/**
 * Monster type definitions
 *
 * Each monster type defines:
 * - health: Maximum health points
 * - attackStrength: Damage dealt per attack
 * - attackRate: Milliseconds between attacks
 * - attackRadius: Distance at which monster aggros and chases player
 * - firstAttackDelay: Milliseconds to wait before first attack after entering range
 * - hitboxWidth: Width of combat hitbox (for click detection)
 * - hitboxHeight: Height of combat hitbox (for click detection)
 * - speed: Movement speed in pixels per second
 * - lootTable: Array of possible loot drops with drop rates
 */

export const MONSTER_TYPES = {
  monster_slime: {
    name: "Slime",
    health: 3,
    attackStrength: 5,
    attackRate: 2000, // 2 seconds between attacks
    attackRadius: 150,
    firstAttackDelay: 1000, // 1 second delay before first attack
    hitboxWidth: 30,
    hitboxHeight: 22,
    speed: 60,
    lootTable: [
      { itemId: "gold", minQuantity: 1, maxQuantity: 5, dropRate: 1.0 }, // Always drops 1-5 gold
      { itemId: "health_potion", quantity: 1, dropRate: 0.1 }, // 10% chance to drop health potion
    ],
  },

  // Add more monster types here as you create them:
  // monster_goblin: {
  //   name: 'Goblin',
  //   health: 50,
  //   attackStrength: 8,
  //   attackRate: 1500,
  //   attackRadius: 180,
  //   firstAttackDelay: 800,
  //   hitboxWidth: 35,
  //   hitboxHeight: 55,
  //   speed: 80,
  //   lootTable: [
  //     { itemId: 'gold', minQuantity: 5, maxQuantity: 15, dropRate: 1.0 },
  //     { itemId: 'equipment_helmet_leather', quantity: 1, dropRate: 0.05 }
  //   ]
  // },
};

/**
 * Get monster data by type
 */
export function getMonsterData(monsterType) {
  // Handle both "slime" and "monster_slime" formats
  let key = monsterType;
  if (!key.startsWith("monster_")) {
    key = `monster_${monsterType}`;
  }

  const data = MONSTER_TYPES[key];
  if (!data) {
    console.warn(`Monster type not found: ${monsterType}, using default slime`);
    return MONSTER_TYPES.monster_slime;
  }

  return data;
}

/**
 * Create full monster spawn data by merging type data with spawn properties
 */
export function createMonsterSpawnData(spawnProps) {
  const typeData = getMonsterData(spawnProps.monsterType);

  return {
    // Monster type data (stats from this file)
    ...typeData,

    // Spawn-specific properties (from Tiled map)
    monsterType: spawnProps.monsterType,
    polygon: spawnProps.polygon,
    patrol: spawnProps.patrol !== undefined ? spawnProps.patrol : true,

    // Keep spawn management properties
    maxCount: spawnProps.maxCount || 1,
    respawn: spawnProps.respawn !== undefined ? spawnProps.respawn : true,
    spawnRate: spawnProps.spawnRate || 30000,
  };
}

/**
 * Roll for loot drops from a monster
 * Returns array of {itemId, quantity}
 */
export function rollMonsterLoot(monsterType) {
  console.log(`[Monsters] Rolling loot for monster type: "${monsterType}"`);

  const monsterData = getMonsterData(monsterType);
  const lootTable = monsterData.lootTable || [];

  console.log(`[Monsters] Loot table entries:`, lootTable.length);

  const drops = [];

  lootTable.forEach((entry) => {
    // Roll for drop chance
    const roll = Math.random();
    console.log(
      `[Monsters] Item ${entry.itemId}: rolled ${roll.toFixed(3)} vs dropRate ${entry.dropRate}`
    );

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
      console.log(`[Monsters] ✓ Dropped ${quantity}x ${entry.itemId}`);
    } else {
      console.log(`[Monsters] ✗ No drop for ${entry.itemId}`);
    }
  });

  console.log(`[Monsters] Total drops:`, drops);
  return drops;
}
