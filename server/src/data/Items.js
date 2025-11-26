/**
 * Item definitions - SERVER AUTHORITATIVE
 *
 * This is the authoritative source for all item data in the MMO.
 * Client should fetch item data from server APIs, not use local copies.
 *
 * Each item has:
 * - id: Unique identifier
 * - name: Display name
 * - type: wearable, consumable, currency, etc.
 * - category: armor, weapon, potion, etc.
 * - slot: Equipment slot (armor, helmet, weapon, shield, boots, amulet, ring)
 * - stats: Stat bonuses (maxHealth, attackStrength, armor, speed, etc.)
 * - effects: Active effects when used/equipped
 * - wearable: Boolean - can be equipped
 * - stackable: Boolean - can stack in inventory
 * - maxStack: Maximum stack size
 * - price: Base gold value
 * - description: Flavor text
 * - icon: Sprite reference for client rendering
 * - animatedSprite: Animated equipment sprite reference
 * - staticWearableSprite: Static wearable sprite reference
 * - visible: Boolean - visible on character when equipped
 */

export const ITEMS = {
  // Armor - animated wearable (visible on player, syncs with walk cycle)
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
    icon: "equipment_armor_leather_static", // UI display (inventory, trade, loot)
    animatedSprite: "equipment_armor_leather", // 300x300 3x3 grid for character
    staticWearableSprite: null, // Not a weapon/shield
    wearable: true,
    visible: true, // Renders on player
    stackable: false,
    maxStack: 1,
    price: 50,
    description: "Basic leather armor providing protection (+1 health)",
  },

  // Helmet - animated wearable (visible on player, syncs with walk cycle)
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
    icon: "equipment_helmet_leather_static", // UI display (inventory, trade, loot)
    animatedSprite: "equipment_helmet_leather", // 300x300 3x3 grid for character
    staticWearableSprite: null, // Not a weapon/shield
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 30,
    description: "A leather helmet providing modest protection (+1 health)",
  },

  // Boots - animated wearable (visible on player, syncs with walk cycle)
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
    icon: "equipment_boots_leather_static", // UI display (inventory, trade, loot)
    animatedSprite: "equipment_boots_leather", // 300x300 3x3 grid for character
    staticWearableSprite: null, // Not a weapon/shield
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 20,
    description: "Sturdy leather boots (+1 health)",
  },

  // Shield - static wearable (visible on player, positioned on side, no walk sync)
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
    icon: "/assets/sprites/static/equipment/shield/shield_wood.png", // UI display
    animatedSprite: null, // Not animated with walk cycle
    staticWearableSprite: "/assets/sprites/static/equipment/shield/shield_wood.png", // Positioned on player side
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 40,
    description: "A basic wooden shield (+1 health)",
  },

  // Weapon - static wearable (visible on player, positioned on side, no walk sync)
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
    icon: "/assets/sprites/static/equipment/weapon/weapon_wood_club.png", // UI display
    animatedSprite: null, // Not animated with walk cycle
    staticWearableSprite: "/assets/sprites/static/equipment/weapon/weapon_wood_club.png", // Positioned on player side
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 35,
    description: "A simple wooden club (+1 attack strength)",
  },

  // Amulet - non-visible wearable (UI only)
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
    icon: "/assets/sprites/static/equipment/amulet/amulet_basic.png", // UI display only
    animatedSprite: null, // Not rendered on character
    staticWearableSprite: null, // Not rendered on character
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 100,
    description: "A mystical amulet (+1 attack strength, +1 armor)",
  },

  // Ring - non-visible wearable (UI only)
  ring_strength: {
    id: "ring_strength",
    name: "Ring of Strength",
    type: "wearable",
    category: "ring",
    slot: "ring", // Can be equipped in either ring slot
    stats: {
      attackStrength: 2,
    },
    effects: [],
    icon: "/assets/sprites/static/equipment/ring/ring_strength.png", // UI display only
    animatedSprite: null, // Not rendered on character
    staticWearableSprite: null, // Not rendered on character
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 150,
    description: "A ring that increases attack strength (+2 attack strength)",
  },

  // Ring - non-visible wearable (UI only)
  ring_defense: {
    id: "ring_defense",
    name: "Ring of Defense",
    type: "wearable",
    category: "ring",
    slot: "ring", // Can be equipped in either ring slot
    stats: {
      armor: 2,
    },
    effects: [],
    icon: "/assets/sprites/static/equipment/ring/ring_defense.png", // UI display only
    animatedSprite: null, // Not rendered on character
    staticWearableSprite: null, // Not rendered on character
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 150,
    description: "A ring that increases defense (+2 armor)",
  },

  // Health Potion - consumable (UI only)
  potion_health: {
    id: "potion_health",
    name: "Health Potion",
    type: "consumable",
    category: "potion",
    slot: null,
    stats: {},
    effects: [{ type: "heal", value: 5 }],
    icon: "/assets/sprites/static/items/item_potion_health.png", // UI display only
    animatedSprite: null, // Not rendered on character
    staticWearableSprite: null, // Not rendered on character
    wearable: false,
    visible: false,
    stackable: true,
    maxStack: 10,
    price: 15,
    description: "Restores 5 health points. Right click to use.",
  },

  // Gold - currency (UI only)
  gold: {
    id: "gold",
    name: "Gold",
    type: "currency",
    category: "currency",
    slot: null,
    stats: {},
    effects: [],
    icon: "item_gold_coin", // UI display only
    animatedSprite: null, // Not rendered on character
    staticWearableSprite: null, // Not rendered on character
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
