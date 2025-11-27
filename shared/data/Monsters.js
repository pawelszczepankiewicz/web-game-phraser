/**
 * Monster type definitions - SERVER AUTHORITATIVE
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
    attackRate: 2000,
    attackRadius: 150,
    firstAttackDelay: 1000,
    hitboxWidth: 30,
    hitboxHeight: 22,
    speed: 60,
    lootTable: [
      { itemId: "gold", minQuantity: 1, maxQuantity: 5, dropRate: 1.0 },
      { itemId: "health_potion", quantity: 1, dropRate: 0.1 },
    ],
  },
  monster_goblin: {
    name: "Goblin",
    health: 6,
    attackStrength: 3,
    attackRate: 1000,
    attackRadius: 150,
    firstAttackDelay: 1000,
    hitboxWidth: 30,
    hitboxHeight: 42,
    speed: 50,
    lootTable: [
      { itemId: "gold", minQuantity: 1, maxQuantity: 10, dropRate: 1.0 },
      { itemId: "helmet_leather", quantity: 1, dropRate: 0.1 },
    ],
  },
};

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

export function rollMonsterLoot(monsterType) {
  const monsterData = getMonsterData(monsterType);
  const lootTable = monsterData.lootTable || [];
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
        instanceId: `${entry.itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }
  });

  return drops;
}

/**
 * Create full monster spawn data by merging type data with spawn properties
 * Used by client MonsterManager when spawning monsters from Tiled map data
 */
export function createMonsterSpawnData(spawnProps) {
  const typeData = getMonsterData(spawnProps.monsterType);

  return {
    // Monster type data (stats from MONSTER_TYPES)
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
