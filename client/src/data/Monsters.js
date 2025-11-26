/**
 * Monster type definitions
 *
 * ⚠️ WARNING: This is a CLIENT-SIDE COPY for rendering purposes only.
 * The SERVER is the authoritative source for all monster stats.
 * Server: /server/src/data/Monsters.js
 *
 * TODO: Refactor to fetch monster data from server instead of using local copy.
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
    attackStrength: 5, // SYNCED WITH SERVER
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
  monster_goblin: {
    name: "Goblin",
    health: 6,
    attackStrength: 3,
    attackRate: 1000, // 2 seconds between attacks
    attackRadius: 150,
    firstAttackDelay: 1000, // 1 second delay before first attack
    hitboxWidth: 30,
    hitboxHeight: 22,
    speed: 50,
    lootTable: [
      { itemId: "gold", minQuantity: 1, maxQuantity: 10, dropRate: 1.0 }, // Always drops 1-5 gold
      { itemId: "helmet_leather", quantity: 1, dropRate: 0.1 }, // 10% chance to drop health potion
    ],
  },
};

/**
 * Get monster data by type
 */
export function getMonsterData(monsterType) {
  let key = monsterType;
  if (!key.startsWith("monster_")) {
    key = `monster_${monsterType}`;
  }

  const data = MONSTER_TYPES[key];
  if (!data) {
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
