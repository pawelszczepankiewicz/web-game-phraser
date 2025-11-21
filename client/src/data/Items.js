/**
 * Item definitions
 *
 * DEVELOPMENT FLOW FOR ADDING NEW ITEMS:
 *
 * 1. WEARABLE EQUIPMENT (visible on character):
 *    - Add animated spritesheet to: /assets/sprites/animated/equipment/{category}/equipment_{name}.png
 *      Format: 300x300px, 3x3 grid (100x100 frames)
 *      Frames: 0=stand_s, 1-2=walk_s, 3-5=walk_e, 6=stand_n, 7-8=walk_n
 *    - Add static icon to: /assets/sprites/static/equipment/{category}/equipment_{name}_static.png
 *    - Load spritesheet in BootScene.js preload()
 *    - Load static icon in BootScene.js preload()
 *    - Create animations in BootScene.js createEquipmentAnimations()
 *    - Item properties:
 *      sprite: "equipment_{name}" (animated spritesheet key for character)
 *      iconSprite: "equipment_{name}_static" (static icon key for inventory/loot)
 *      spriteType: "animated"
 *      visible: true
 *
 * 2. WEARABLE EQUIPMENT (NOT visible on character - amulets, rings):
 *    - Add static icon to: /assets/sprites/static/equipment/{category}/{name}_static.png
 *    - Load static icon in BootScene.js preload()
 *    - Item properties:
 *      sprite: null (not rendered on character)
 *      iconSprite: "{name}_static" (static icon key for inventory/loot)
 *      spriteType: "static"
 *      visible: false
 *
 * 3. CONSUMABLES & CURRENCY:
 *    - Add static sprite to: /assets/sprites/static/items/{name}.png
 *    - Load in BootScene.js preload()
 *    - Item properties:
 *      sprite: "{name}" (static sprite key for inventory/loot)
 *      iconSprite: null (not needed, sprite is already static)
 *      spriteType: "static"
 *      visible: false
 *
 * Each item has: id, name, type, category, slot, stats, effects, sprite, iconSprite, spriteType, wearable, visible, stackable, maxStack, price, description
 */

export const ITEMS = {
  // Armor - visible on player
  armor_leather: {
    id: "armor_leather",
    name: "Leather Armor",
    type: "wearable",
    category: "armor",
    slot: "armor",
    stats: {
      maxHealth: 1,
    },
    effects: [],
    sprite: "equipment_armor_leather", // Animated sprite for character
    iconSprite: "equipment_armor_leather_static", // Static icon for inventory/loot
    spriteType: "animated", // Uses spritesheet
    wearable: true,
    visible: true, // Renders on player
    stackable: false,
    maxStack: 1,
    price: 50,
    description: "Basic leather armor providing protection (+1 health)",
  },

  // Helmet - visible on player
  helmet_leather: {
    id: "helmet_leather",
    name: "Leather Helmet",
    type: "wearable",
    category: "helmet",
    slot: "helmet",
    stats: {
      maxHealth: 1,
    },
    effects: [],
    sprite: "equipment_helmet_leather", // Animated sprite for character
    iconSprite: "equipment_helmet_leather_static", // Static icon for inventory/loot
    spriteType: "animated",
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 30,
    description: "A leather helmet providing modest protection (+1 health)",
  },

  // Boots - visible on player
  boots_leather: {
    id: "boots_leather",
    name: "Leather Boots",
    type: "wearable",
    category: "boots",
    slot: "boots",
    stats: {
      maxHealth: 1,
    },
    effects: [],
    sprite: "equipment_boots_leather", // Animated sprite for character
    iconSprite: "equipment_boots_leather_static", // Static icon for inventory/loot
    spriteType: "animated",
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 20,
    description: "Sturdy leather boots (+1 health)",
  },

  // Shield - visible on player (placeholder)
  shield_wood: {
    id: "shield_wood",
    name: "Wood Shield",
    type: "wearable",
    category: "shield",
    slot: "shield",
    stats: {
      maxHealth: 1,
    },
    effects: [],
    sprite: null, // TODO: Add animated spritesheet to /assets/sprites/animated/equipment/shield/equipment_shield_wood.png
    iconSprite: null, // TODO: Add static icon image to /assets/sprites/static/equipment/shield/equipment_shield_wood_static.png
    spriteType: "animated",
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 40,
    description: "A basic wooden shield (+1 health)",
  },

  // Weapon - visible on player (placeholder)
  weapon_wood_club: {
    id: "weapon_wood_club",
    name: "Wood Club",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    stats: {
      attackStrength: 1,
    },
    effects: [],
    sprite: null, // TODO: Add animated spritesheet to /assets/sprites/animated/equipment/weapon/equipment_weapon_wood_club.png
    iconSprite: null, // TODO: Add static icon image to /assets/sprites/static/equipment/weapon/equipment_weapon_wood_club_static.png
    spriteType: "animated",
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 35,
    description: "A simple wooden club (+1 attack strength)",
  },

  // Amulet - NOT visible on player
  amulet_basic: {
    id: "amulet_basic",
    name: "Amulet",
    type: "wearable",
    category: "amulet",
    slot: "amulet",
    stats: {
      attackStrength: 1,
      armor: 1,
    },
    effects: [],
    sprite: null, // Not visible on character
    iconSprite: null, // TODO: Add static icon image to /assets/sprites/static/equipment/amulet/amulet_basic_static.png
    spriteType: "static",
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 100,
    description: "A mystical amulet (+1 attack strength, +1 armor)",
  },

  // Ring - NOT visible on player
  ring_strength: {
    id: "ring_strength",
    name: "Ring of Strength",
    type: "wearable",
    category: "ring",
    slot: "ring_left", // Can be equipped in either ring slot
    stats: {
      attackStrength: 2,
    },
    effects: [],
    sprite: null, // Not visible on character
    iconSprite: null, // TODO: Add static icon image to /assets/sprites/static/equipment/ring/ring_strength_static.png
    spriteType: "static",
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 150,
    description: "A ring that increases attack strength (+2 attack strength)",
  },

  // Ring - NOT visible on player
  ring_defense: {
    id: "ring_defense",
    name: "Ring of Defense",
    type: "wearable",
    category: "ring",
    slot: "ring_left", // Can be equipped in either ring slot
    stats: {
      armor: 2,
    },
    effects: [],
    sprite: null, // Not visible on character
    iconSprite: null, // TODO: Add static icon image to /assets/sprites/static/equipment/ring/ring_defense_static.png
    spriteType: "static",
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 150,
    description: "A ring that increases defense (+2 armor)",
  },

  // Health Potion - consumable
  potion_health: {
    id: "potion_health",
    name: "Health Potion",
    type: "consumable",
    category: "potion",
    slot: null,
    stats: {},
    effects: [{ type: "heal", value: 5 }],
    sprite: null, // Placeholder - no sprite yet
    spriteType: "static",
    wearable: false,
    visible: false,
    stackable: true,
    maxStack: 10,
    price: 15,
    description: "Restores 5 health points. Right click to use.",
  },

  // Gold - currency
  gold: {
    id: "gold",
    name: "Gold",
    type: "currency",
    category: "currency",
    slot: null,
    stats: {},
    effects: [],
    sprite: "item_gold_coin",
    spriteType: "static",
    wearable: false,
    visible: false,
    stackable: true,
    maxStack: 1000,
    price: 1, // Gold is the currency itself
    description: "Shiny gold coins used as currency",
  },
};

/**
 * Get item by ID
 */
export function getItem(itemId) {
  return ITEMS[itemId] || null;
}

/**
 * Create item instance with unique ID
 */
export function createItemInstance(itemId, quantity = 1) {
  const itemDef = getItem(itemId);
  if (!itemDef) return null;

  return {
    instanceId: generateUniqueId(),
    itemId: itemId,
    quantity: itemDef.stackable ? quantity : 1,
    ...itemDef,
  };
}

/**
 * Generate unique ID for item instances
 */
function generateUniqueId() {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
