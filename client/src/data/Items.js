/**
 * Item definitions
 * Each item has: id, name, type, slot, stats, effects, sprite, wearable, animated
 */

export const ITEMS = {
  // Helmets
  helmet_leather: {
    id: 'helmet_leather',
    name: 'Leather Helmet',
    type: 'armor',
    slot: 'helmet',
    stats: {
      armor: 2
    },
    effects: [],
    sprite: 'helmet_leather',
    wearable: true,
    animated: true,
    description: 'A basic leather helmet providing modest protection'
  },

  // Armor
  armor_leather: {
    id: 'armor_leather',
    name: 'Leather Armor',
    type: 'armor',
    slot: 'armor',
    stats: {
      armor: 5
    },
    effects: [],
    sprite: null, // To be added when sprite is available
    wearable: true,
    animated: true,
    description: 'Basic leather armor'
  },

  // Weapons
  weapon_sword_basic: {
    id: 'weapon_sword_basic',
    name: 'Basic Sword',
    type: 'weapon',
    slot: 'weapon',
    stats: {
      attackStrength: 5
    },
    effects: [],
    sprite: null, // To be added when sprite is available
    wearable: true,
    animated: true,
    description: 'A simple iron sword'
  },

  // Shields
  shield_wooden: {
    id: 'shield_wooden',
    name: 'Wooden Shield',
    type: 'shield',
    slot: 'shield',
    stats: {
      armor: 3
    },
    effects: [],
    sprite: null, // To be added when sprite is available
    wearable: true,
    animated: true,
    description: 'A basic wooden shield'
  },

  // Consumables / Non-wearable items
  item_gold_coin: {
    id: 'item_gold_coin',
    name: 'Gold Coin',
    type: 'currency',
    slot: null,
    stats: {},
    effects: [],
    sprite: 'item_gold_coin',
    wearable: false,
    animated: false,
    stackable: true,
    description: 'Shiny gold coin used as currency'
  },

  potion_health_small: {
    id: 'potion_health_small',
    name: 'Small Health Potion',
    type: 'consumable',
    slot: null,
    stats: {},
    effects: [
      { type: 'heal', value: 25 }
    ],
    sprite: null, // To be added when sprite is available
    wearable: false,
    animated: false,
    stackable: true,
    description: 'Restores 25 health points'
  }
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
    ...itemDef
  };
}

/**
 * Generate unique ID for item instances
 */
function generateUniqueId() {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
