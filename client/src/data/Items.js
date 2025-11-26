/**
 * Item definitions
 *
 * ⚠️ WARNING: This is a CLIENT-SIDE COPY for rendering/UI purposes only.
 * The SERVER is the authoritative source for all item stats, prices, and effects.
 * Server: /server/src/data/Items.js
 *
 * TODO: Refactor to fetch item data from server instead of using local copy.
 *
 * SPRITE ARCHITECTURE:
 *
 * 1. icon - UI display sprite (inventory, trade panels, loot bags, quick actions bar)
 *    - Can be sprite key (loaded in BootScene) OR full path (loaded dynamically)
 *    - Always required for visible items
 *
 * 2. animatedSprite - 300x300px 3x3 grid spritesheet for ANIMATED wearables
 *    - Used for: helmet, armor, boots
 *    - Syncs with character walk/stand animations
 *    - Frames: 0=stand_s, 1-2=walk_s, 3-5=walk_e, 6=stand_n, 7-8=walk_n
 *    - Must have matching animations created in BootScene
 *
 * 3. staticWearableSprite - Static sprite for weapons and shields
 *    - Used for: weapons, shields
 *    - Rendered on player but doesn't sync with walk cycle
 *    - Positioned on sides of character (weapon=right, shield=left)
 *    - Can have custom animations (e.g., attack swing)
 *
 * DEVELOPMENT FLOW FOR ADDING NEW ITEMS:
 *
 * A. ANIMATED WEARABLES (helmet, armor, boots):
 *    1. Create 300x300px 3x3 grid spritesheet: /assets/sprites/animated/equipment/{category}/equipment_{name}.png
 *    2. Create UI icon: /assets/sprites/static/equipment/{category}/equipment_{name}_icon.png
 *    3. Load both in BootScene.js preload()
 *    4. Create animations in BootScene.js createEquipmentAnimations()
 *    5. Set item properties:
 *       icon: "equipment_{name}_icon"
 *       animatedSprite: "equipment_{name}"
 *       staticWearableSprite: null
 *       visible: true
 *
 * B. STATIC WEARABLES (weapons, shields):
 *    1. Create static sprite: /assets/sprites/static/equipment/{category}/{name}.png
 *    2. Use same image for icon and wearable sprite
 *    3. Load in BootScene.js preload() OR use dynamic loading (full path)
 *    4. Set item properties:
 *       icon: "/assets/sprites/static/equipment/{category}/{name}.png"
 *       animatedSprite: null
 *       staticWearableSprite: "/assets/sprites/static/equipment/{category}/{name}.png"
 *       visible: true
 *
 * C. NON-VISIBLE WEARABLES (amulets, rings):
 *    1. Create UI icon: /assets/sprites/static/equipment/{category}/{name}.png
 *    2. Set item properties:
 *       icon: "/assets/sprites/static/equipment/{category}/{name}.png"
 *       animatedSprite: null
 *       staticWearableSprite: null
 *       visible: false
 *
 * D. CONSUMABLES & CURRENCY:
 *    1. Create UI icon: /assets/sprites/static/items/{name}.png
 *    2. Load in BootScene.js preload()
 *    3. Set item properties:
 *       icon: "{name}" or "/assets/sprites/static/items/{name}.png"
 *       animatedSprite: null
 *       staticWearableSprite: null
 *       visible: false
 *
 * Each item has: id, name, type, category, slot, stats, effects, icon, animatedSprite, staticWearableSprite, wearable, visible, stackable, maxStack, price, description
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
