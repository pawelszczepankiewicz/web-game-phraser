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
      { itemId: "potion_health", quantity: 1, dropRate: 0.1 },
      { itemId: "boots_leather", quantity: 1, dropRate: 0.05 },
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
      { itemId: "gold", minQuantity: 5, maxQuantity: 15, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 1, dropRate: 0.15 },
      { itemId: "helmet_leather", quantity: 1, dropRate: 0.12 },
      { itemId: "armor_leather", quantity: 1, dropRate: 0.1 },
      { itemId: "weapon_wood_club", quantity: 1, dropRate: 0.08 },
    ],
  },
  monster_skeleton: {
    name: "Skeleton",
    health: 10,
    attackStrength: 6,
    attackRate: 1200,
    attackRadius: 160,
    firstAttackDelay: 800,
    hitboxWidth: 32,
    hitboxHeight: 45,
    speed: 55,
    lootTable: [
      { itemId: "gold", minQuantity: 10, maxQuantity: 25, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 1, dropRate: 0.25 },
      { itemId: "helmet_iron", quantity: 1, dropRate: 0.12 },
      { itemId: "armor_iron", quantity: 1, dropRate: 0.1 },
      { itemId: "boots_leather", quantity: 1, dropRate: 0.18 },
      { itemId: "ring_defense", quantity: 1, dropRate: 0.05 },
    ],
  },
  monster_wolf: {
    name: "Wolf",
    health: 15,
    attackStrength: 8,
    attackRate: 800,
    attackRadius: 180,
    firstAttackDelay: 600,
    hitboxWidth: 35,
    hitboxHeight: 30,
    speed: 80,
    lootTable: [
      { itemId: "gold", minQuantity: 15, maxQuantity: 35, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 1, dropRate: 0.3 },
      { itemId: "boots_iron", quantity: 1, dropRate: 0.15 },
      { itemId: "helmet_iron", quantity: 1, dropRate: 0.12 },
      { itemId: "ring_swiftness", quantity: 1, dropRate: 0.08 },
    ],
  },
  monster_orc: {
    name: "Orc",
    health: 25,
    attackStrength: 12,
    attackRate: 1500,
    attackRadius: 150,
    firstAttackDelay: 1000,
    hitboxWidth: 38,
    hitboxHeight: 50,
    speed: 45,
    lootTable: [
      { itemId: "gold", minQuantity: 25, maxQuantity: 50, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 1, dropRate: 0.35 },
      { itemId: "armor_iron", quantity: 1, dropRate: 0.18 },
      { itemId: "helmet_steel", quantity: 1, dropRate: 0.15 },
      { itemId: "weapon_iron_sword", quantity: 1, dropRate: 0.15 },
      { itemId: "shield_iron", quantity: 1, dropRate: 0.12 },
      { itemId: "ring_strength", quantity: 1, dropRate: 0.1 },
    ],
  },
  monster_dark_mage: {
    name: "Dark Mage",
    health: 20,
    attackStrength: 15,
    attackRate: 2000,
    attackRadius: 200,
    firstAttackDelay: 1500,
    hitboxWidth: 32,
    hitboxHeight: 48,
    speed: 40,
    // Ranged attack configuration - supports multiple patterns
    rangedAttack: {
      enabled: true,
      range: 300, // Max range for ranged attack (will use melee if closer than meleeRange)
      meleeRange: 80, // If player is closer than this, use melee attack instead
      projectile: {
        type: "fireball", // Sprite key
        speed: 200, // Pixels per second
        width: 36, // Hitbox width
        height: 48, // Hitbox height
      },
      // Multiple attack patterns - monster will cycle through them
      patterns: [
        {
          name: "single",
          damage: 12,
          cooldown: 2500,
          pattern: "single",
          projectileCount: 1,
          spreadAngle: 0,
        },
        {
          name: "ring",
          damage: 8, // Less damage per projectile since there are multiple
          cooldown: 4000, // Longer cooldown for stronger attack
          pattern: "ring",
          projectileCount: 6, // 6 projectiles in a ring
          spreadAngle: 360, // Full circle
        },
      ],
    },
    lootTable: [
      { itemId: "gold", minQuantity: 30, maxQuantity: 60, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 2, dropRate: 0.4 },
      { itemId: "armor_steel", quantity: 1, dropRate: 0.18 },
      { itemId: "helmet_steel", quantity: 1, dropRate: 0.15 },
      { itemId: "amulet_basic", quantity: 1, dropRate: 0.12 },
      { itemId: "amulet_protection", quantity: 1, dropRate: 0.08 },
      { itemId: "ring_power", quantity: 1, dropRate: 0.1 },
    ],
  },
  monster_troll: {
    name: "Troll",
    health: 50,
    attackStrength: 18,
    attackRate: 2500,
    attackRadius: 140,
    firstAttackDelay: 1200,
    hitboxWidth: 45,
    hitboxHeight: 60,
    speed: 35,
    lootTable: [
      { itemId: "gold", minQuantity: 50, maxQuantity: 100, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 2, dropRate: 0.5 },
      { itemId: "armor_steel", quantity: 1, dropRate: 0.22 },
      { itemId: "helmet_mithril", quantity: 1, dropRate: 0.15 },
      { itemId: "shield_steel", quantity: 1, dropRate: 0.2 },
      { itemId: "shield_mithril", quantity: 1, dropRate: 0.12 },
      { itemId: "ring_vitality", quantity: 1, dropRate: 0.15 },
    ],
  },
  monster_wraith: {
    name: "Wraith",
    health: 35,
    attackStrength: 20,
    attackRate: 1000,
    attackRadius: 170,
    firstAttackDelay: 700,
    hitboxWidth: 35,
    hitboxHeight: 52,
    speed: 70,
    lootTable: [
      { itemId: "gold", minQuantity: 60, maxQuantity: 120, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 2, dropRate: 0.45 },
      { itemId: "armor_mithril", quantity: 1, dropRate: 0.18 },
      { itemId: "boots_steel", quantity: 1, dropRate: 0.2 },
      { itemId: "boots_mithril", quantity: 1, dropRate: 0.15 },
      { itemId: "amulet_protection", quantity: 1, dropRate: 0.15 },
      { itemId: "amulet_fury", quantity: 1, dropRate: 0.12 },
      { itemId: "ring_swiftness", quantity: 1, dropRate: 0.18 },
    ],
  },
  monster_deamon: {
    name: "Demon",
    health: 60,
    attackStrength: 25,
    attackRate: 900,
    attackRadius: 160,
    firstAttackDelay: 800,
    hitboxWidth: 40,
    hitboxHeight: 55,
    speed: 65,
    lootTable: [
      { itemId: "gold", minQuantity: 100, maxQuantity: 200, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 3, dropRate: 0.6 },
      { itemId: "armor_mithril", quantity: 1, dropRate: 0.25 },
      { itemId: "helmet_mithril", quantity: 1, dropRate: 0.22 },
      { itemId: "armor_dragon", quantity: 1, dropRate: 0.15 },
      { itemId: "weapon_mithril_sword", quantity: 1, dropRate: 0.2 },
      { itemId: "shield_mithril", quantity: 1, dropRate: 0.18 },
      { itemId: "ring_power", quantity: 1, dropRate: 0.2 },
      { itemId: "amulet_fury", quantity: 1, dropRate: 0.18 },
    ],
  },
  monster_dragon_whelp: {
    name: "Dragon Whelp",
    health: 80,
    attackStrength: 30,
    attackRate: 1200,
    attackRadius: 180,
    firstAttackDelay: 1000,
    hitboxWidth: 50,
    hitboxHeight: 45,
    speed: 55,
    lootTable: [
      { itemId: "gold", minQuantity: 150, maxQuantity: 300, dropRate: 1.0 },
      { itemId: "potion_health", quantity: 4, dropRate: 0.7 },
      { itemId: "armor_dragon", quantity: 1, dropRate: 0.25 },
      { itemId: "helmet_dragon", quantity: 1, dropRate: 0.22 },
      { itemId: "boots_dragon", quantity: 1, dropRate: 0.2 },
      { itemId: "armor_mithril", quantity: 1, dropRate: 0.35 },
      { itemId: "weapon_dragon_sword", quantity: 1, dropRate: 0.18 },
      { itemId: "shield_dragon", quantity: 1, dropRate: 0.2 },
      { itemId: "ring_ancient", quantity: 1, dropRate: 0.15 },
      { itemId: "amulet_archon", quantity: 1, dropRate: 0.1 },
    ],
  },
  // TODO: BOSSES (not added yet)
  // monster_goblin_king: {
  //   name: "Goblin King",
  //   health: 150,
  //   attackStrength: 35,
  //   attackRate: 800,
  //   attackRadius: 200,
  //   firstAttackDelay: 500,
  //   hitboxWidth: 60,
  //   hitboxHeight: 70,
  //   speed: 60,
  //   isBoss: true,
  //   lootTable: [
  //     { itemId: "gold", minQuantity: 200, maxQuantity: 400, dropRate: 1.0 },
  //     { itemId: "potion_health", quantity: 5, dropRate: 1.0 },
  //     { itemId: "armor_steel", quantity: 1, dropRate: 0.6 },
  //     { itemId: "helmet_steel", quantity: 1, dropRate: 0.6 },
  //     { itemId: "armor_mithril", quantity: 1, dropRate: 0.4 },
  //     { itemId: "helmet_mithril", quantity: 1, dropRate: 0.35 },
  //     { itemId: "weapon_steel_sword", quantity: 1, dropRate: 0.5 },
  //     { itemId: "shield_steel", quantity: 1, dropRate: 0.5 },
  //     { itemId: "ring_power", quantity: 1, dropRate: 0.4 },
  //     { itemId: "ring_vitality", quantity: 1, dropRate: 0.4 },
  //     { itemId: "amulet_protection", quantity: 1, dropRate: 0.35 },
  //   ],
  // },
  // monster_ancient_lich: {
  //   name: "Ancient Lich",
  //   health: 250,
  //   attackStrength: 45,
  //   attackRate: 1500,
  //   attackRadius: 250,
  //   firstAttackDelay: 1000,
  //   hitboxWidth: 55,
  //   hitboxHeight: 75,
  //   speed: 50,
  //   isBoss: true,
  //   lootTable: [
  //     { itemId: "gold", minQuantity: 400, maxQuantity: 800, dropRate: 1.0 },
  //     { itemId: "potion_health", quantity: 8, dropRate: 1.0 },
  //     { itemId: "armor_mithril", quantity: 1, dropRate: 0.7 },
  //     { itemId: "helmet_mithril", quantity: 1, dropRate: 0.7 },
  //     { itemId: "armor_dragon", quantity: 1, dropRate: 0.5 },
  //     { itemId: "helmet_dragon", quantity: 1, dropRate: 0.5 },
  //     { itemId: "boots_dragon", quantity: 1, dropRate: 0.45 },
  //     { itemId: "weapon_mithril_sword", quantity: 1, dropRate: 0.6 },
  //     { itemId: "weapon_dragon_sword", quantity: 1, dropRate: 0.4 },
  //     { itemId: "shield_mithril", quantity: 1, dropRate: 0.6 },
  //     { itemId: "shield_dragon", quantity: 1, dropRate: 0.4 },
  //     { itemId: "ring_ancient", quantity: 1, dropRate: 0.5 },
  //     { itemId: "amulet_archon", quantity: 1, dropRate: 0.35 },
  //     { itemId: "amulet_fury", quantity: 1, dropRate: 0.5 },
  //   ],
  // },
  // monster_infernal_dragon: {
  //   name: "Infernal Dragon",
  //   health: 500,
  //   attackStrength: 60,
  //   attackRate: 1000,
  //   attackRadius: 300,
  //   firstAttackDelay: 800,
  //   hitboxWidth: 80,
  //   hitboxHeight: 90,
  //   speed: 70,
  //   isBoss: true,
  //   lootTable: [
  //     { itemId: "gold", minQuantity: 1000, maxQuantity: 2000, dropRate: 1.0 },
  //     { itemId: "potion_health", quantity: 10, dropRate: 1.0 },
  //     { itemId: "armor_dragon", quantity: 1, dropRate: 0.8 },
  //     { itemId: "helmet_dragon", quantity: 1, dropRate: 0.8 },
  //     { itemId: "boots_dragon", quantity: 1, dropRate: 0.75 },
  //     { itemId: "armor_infernal", quantity: 1, dropRate: 0.5 },
  //     { itemId: "helmet_infernal", quantity: 1, dropRate: 0.5 },
  //     { itemId: "boots_infernal", quantity: 1, dropRate: 0.45 },
  //     { itemId: "weapon_dragon_sword", quantity: 1, dropRate: 0.7 },
  //     { itemId: "weapon_infernal_blade", quantity: 1, dropRate: 0.4 },
  //     { itemId: "shield_dragon", quantity: 1, dropRate: 0.7 },
  //     { itemId: "shield_infernal", quantity: 1, dropRate: 0.4 },
  //     { itemId: "ring_ancient", quantity: 1, dropRate: 0.7 },
  //     { itemId: "ring_power", quantity: 1, dropRate: 0.8 },
  //     { itemId: "amulet_archon", quantity: 1, dropRate: 0.6 },
  //     { itemId: "amulet_fury", quantity: 1, dropRate: 0.7 },
  //   ],
  // },
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
          Math.random() * (entry.maxQuantity - entry.minQuantity + 1) +
            entry.minQuantity
        );
      } else {
        quantity = entry.quantity || 1;
      }

      drops.push({
        itemId: entry.itemId,
        quantity: quantity,
        instanceId: `${entry.itemId}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
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
