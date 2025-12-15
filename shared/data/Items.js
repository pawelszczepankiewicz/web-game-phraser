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

/**
 * Helper functions to generate sprite paths
 */

// For animated equipment (helmet, armor, boots) - returns sprite key
export const animatedIcon = (category, material) =>
  `equipment_${category}_${material}_static`;
export const animatedSprite = (category, material) =>
  `equipment_${category}_${material}`;

// For static equipment (weapon, shield, amulet, ring) - returns full path
export const staticIcon = (category, id) =>
  `/assets/sprites/static/equipment/${category}/${id}.png`;
export const staticWearable = (category, id) =>
  `/assets/sprites/static/equipment/${category}/${id}.png`;

// For consumables and items - returns full path
export const itemIcon = (id) => `/assets/sprites/static/items/${id}.png`;

// For currency - returns sprite key
export const currencyIcon = (spriteKey) => spriteKey;

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
    icon: animatedIcon("armor", "leather"), // UI display (inventory, trade, loot)
    animatedSprite: animatedSprite("armor", "leather"), // 300x300 3x3 grid for character
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
    icon: animatedIcon("helmet", "leather"), // UI display (inventory, trade, loot)
    animatedSprite: animatedSprite("helmet", "leather"), // 300x300 3x3 grid for character
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
    icon: animatedIcon("boots", "leather"), // UI display (inventory, trade, loot)
    animatedSprite: animatedSprite("boots", "leather"), // 300x300 3x3 grid for character
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
    icon: staticIcon("shield", "shield_wood"), // UI display
    animatedSprite: null, // Not animated with walk cycle
    staticWearableSprite: staticWearable("shield", "shield_wood"), // Positioned on player side
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
    weaponType: "melee", // melee or ranged
    stats: {
      attackStrength: 1,
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_wood_club"), // UI display
    animatedSprite: null, // Not animated with walk cycle
    staticWearableSprite: staticWearable("weapon", "weapon_wood_club"), // Positioned on player side
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 35,
    description: "A simple wooden club (+1 attack strength)",
  },

  // Ranged Weapon - Crossbow
  weapon_wood_crossbow: {
    id: "weapon_wood_crossbow",
    name: "Wood Crossbow",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    weaponType: "ranged", // ranged weapon
    stats: {
      attackStrength: 8, // Base damage for projectile
    },
    rangedAttack: {
      range: 350, // Max attack range in pixels
      cooldown: 1500, // Attack cooldown in ms
      projectile: {
        type: "arrow", // Sprite key
        speed: 300, // Pixels per second
        width: 32, // Hitbox width
        height: 32, // Hitbox height
      },
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_wood_crossbow"), // UI display
    animatedSprite: null, // Not animated with walk cycle
    staticWearableSprite: {
      path: staticWearable("weapon", "weapon_wood_crossbow"),
      scale: 0.5, // 50% size
    }, // Positioned on player side
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 150,
    description:
      "A wooden crossbow for ranged attacks (+8 attack strength, 350 range)",
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
    icon: staticIcon("amulet", "amulet_basic"), // UI display only
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
    icon: staticIcon("ring", "ring_strength"), // UI display only
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
    icon: staticIcon("ring", "ring_defense"), // UI display only
    animatedSprite: null, // Not rendered on character
    staticWearableSprite: null, // Not rendered on character
    wearable: true,
    visible: false, // Does NOT render on player
    stackable: false,
    maxStack: 1,
    price: 150,
    description: "A ring that increases defense (+2 armor)",
  },

  // ==================== TIER 2 GEAR - IRON ====================

  armor_iron: {
    id: "armor_iron",
    name: "Iron Armor",
    type: "wearable",
    category: "armor",
    slot: "armor",
    stats: {
      maxHealth: 5,
      armor: 2,
    },
    effects: [],
    icon: animatedIcon("armor", "iron"),
    animatedSprite: animatedSprite("armor", "iron"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 150,
    description: "Sturdy iron armor (+5 health, +2 armor)",
  },

  helmet_iron: {
    id: "helmet_iron",
    name: "Iron Helmet",
    type: "wearable",
    category: "helmet",
    slot: "helmet",
    stats: {
      maxHealth: 3,
      armor: 1,
    },
    effects: [],
    icon: animatedIcon("helmet", "iron"),
    animatedSprite: animatedSprite("helmet", "iron"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 100,
    description: "Iron helmet providing solid protection (+3 health, +1 armor)",
  },

  boots_iron: {
    id: "boots_iron",
    name: "Iron Boots",
    type: "wearable",
    category: "boots",
    slot: "boots",
    stats: {
      maxHealth: 2,
      armor: 1,
    },
    effects: [],
    icon: animatedIcon("boots", "iron"),
    animatedSprite: animatedSprite("boots", "iron"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 80,
    description: "Heavy iron boots (+2 health, +1 armor)",
  },

  shield_iron: {
    id: "shield_iron",
    name: "Iron Shield",
    type: "wearable",
    category: "shield",
    slot: "shield",
    stats: {
      maxHealth: 4,
      armor: 2,
    },
    effects: [],
    icon: staticIcon("shield", "shield_iron"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("shield", "shield_iron"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 120,
    description: "A solid iron shield (+4 health, +2 armor)",
  },

  weapon_iron_sword: {
    id: "weapon_iron_sword",
    name: "Iron Sword",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    stats: {
      attackStrength: 5,
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_iron_sword"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("weapon", "weapon_iron_sword"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 110,
    description: "A sharp iron blade (+5 attack strength)",
  },

  // ==================== TIER 3 GEAR - STEEL ====================

  armor_steel: {
    id: "armor_steel",
    name: "Steel Armor",
    type: "wearable",
    category: "armor",
    slot: "armor",
    stats: {
      maxHealth: 10,
      armor: 5,
    },
    effects: [],
    icon: animatedIcon("armor", "steel"),
    animatedSprite: animatedSprite("armor", "steel"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 350,
    description: "Reinforced steel armor (+10 health, +5 armor)",
  },

  helmet_steel: {
    id: "helmet_steel",
    name: "Steel Helmet",
    type: "wearable",
    category: "helmet",
    slot: "helmet",
    stats: {
      maxHealth: 6,
      armor: 3,
    },
    effects: [],
    icon: animatedIcon("helmet", "steel"),
    animatedSprite: animatedSprite("helmet", "steel"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 250,
    description: "Polished steel helmet (+6 health, +3 armor)",
  },

  boots_steel: {
    id: "boots_steel",
    name: "Steel Boots",
    type: "wearable",
    category: "boots",
    slot: "boots",
    stats: {
      maxHealth: 4,
      armor: 2,
    },
    effects: [],
    icon: animatedIcon("boots", "steel"),
    animatedSprite: animatedSprite("boots", "steel"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 200,
    description: "Steel-plated boots (+4 health, +2 armor)",
  },

  shield_steel: {
    id: "shield_steel",
    name: "Steel Shield",
    type: "wearable",
    category: "shield",
    slot: "shield",
    stats: {
      maxHealth: 8,
      armor: 4,
    },
    effects: [],
    icon: staticIcon("shield", "shield_steel"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("shield", "shield_steel"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 300,
    description: "A mighty steel shield (+8 health, +4 armor)",
  },

  weapon_steel_sword: {
    id: "weapon_steel_sword",
    name: "Steel Sword",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    stats: {
      attackStrength: 12,
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_steel_sword"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("weapon", "weapon_steel_sword"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 280,
    description: "A masterwork steel sword (+12 attack strength)",
  },

  // ==================== TIER 4 GEAR - MITHRIL ====================

  armor_mithril: {
    id: "armor_mithril",
    name: "Mithril Armor",
    type: "wearable",
    category: "armor",
    slot: "armor",
    stats: {
      maxHealth: 20,
      armor: 10,
      speed: 5,
    },
    effects: [],
    icon: animatedIcon("armor", "mithril"),
    animatedSprite: animatedSprite("armor", "mithril"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 800,
    description: "Lightweight mithril armor (+20 health, +10 armor, +5 speed)",
  },

  helmet_mithril: {
    id: "helmet_mithril",
    name: "Mithril Helmet",
    type: "wearable",
    category: "helmet",
    slot: "helmet",
    stats: {
      maxHealth: 12,
      armor: 6,
    },
    effects: [],
    icon: animatedIcon("helmet", "mithril"),
    animatedSprite: animatedSprite("helmet", "mithril"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 600,
    description: "Gleaming mithril helmet (+12 health, +6 armor)",
  },

  boots_mithril: {
    id: "boots_mithril",
    name: "Mithril Boots",
    type: "wearable",
    category: "boots",
    slot: "boots",
    stats: {
      maxHealth: 8,
      armor: 4,
      speed: 10,
    },
    effects: [],
    icon: animatedIcon("boots", "mithril"),
    animatedSprite: animatedSprite("boots", "mithril"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 500,
    description: "Swift mithril boots (+8 health, +4 armor, +10 speed)",
  },

  shield_mithril: {
    id: "shield_mithril",
    name: "Mithril Shield",
    type: "wearable",
    category: "shield",
    slot: "shield",
    stats: {
      maxHealth: 15,
      armor: 8,
    },
    effects: [],
    icon: staticIcon("shield", "shield_mithril"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("shield", "shield_mithril"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 700,
    description: "A legendary mithril shield (+15 health, +8 armor)",
  },

  weapon_mithril_sword: {
    id: "weapon_mithril_sword",
    name: "Mithril Sword",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    stats: {
      attackStrength: 25,
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_mithril_sword"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("weapon", "weapon_mithril_sword"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 650,
    description: "A razor-sharp mithril blade (+25 attack strength)",
  },

  // ==================== TIER 5 GEAR - DRAGON ====================

  armor_dragon: {
    id: "armor_dragon",
    name: "Dragon Scale Armor",
    type: "wearable",
    category: "armor",
    slot: "armor",
    stats: {
      maxHealth: 35,
      armor: 18,
      speed: 10,
      attackStrength: 5,
    },
    effects: [],
    icon: animatedIcon("armor", "dragon"),
    animatedSprite: animatedSprite("armor", "dragon"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 2000,
    description:
      "Armor forged from dragon scales (+35 health, +18 armor, +10 speed, +5 attack)",
  },

  helmet_dragon: {
    id: "helmet_dragon",
    name: "Dragon Helm",
    type: "wearable",
    category: "helmet",
    slot: "helmet",
    stats: {
      maxHealth: 22,
      armor: 12,
      attackStrength: 3,
    },
    effects: [],
    icon: animatedIcon("helmet", "dragon"),
    animatedSprite: animatedSprite("helmet", "dragon"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 1500,
    description: "A fearsome dragon helm (+22 health, +12 armor, +3 attack)",
  },

  boots_dragon: {
    id: "boots_dragon",
    name: "Dragon Boots",
    type: "wearable",
    category: "boots",
    slot: "boots",
    stats: {
      maxHealth: 15,
      armor: 8,
      speed: 20,
    },
    effects: [],
    icon: animatedIcon("boots", "dragon"),
    animatedSprite: animatedSprite("boots", "dragon"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 1200,
    description:
      "Boots crafted from dragon hide (+15 health, +8 armor, +20 speed)",
  },

  shield_dragon: {
    id: "shield_dragon",
    name: "Dragon Shield",
    type: "wearable",
    category: "shield",
    slot: "shield",
    stats: {
      maxHealth: 28,
      armor: 15,
    },
    effects: [],
    icon: staticIcon("shield", "shield_dragon"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("shield", "shield_dragon"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 1800,
    description:
      "A shield bearing the crest of dragons (+28 health, +15 armor)",
  },

  weapon_dragon_sword: {
    id: "weapon_dragon_sword",
    name: "Dragonblade",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    stats: {
      attackStrength: 45,
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_dragon_sword"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("weapon", "weapon_dragon_sword"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 1700,
    description: "A blade forged in dragonfire (+45 attack strength)",
  },

  // ==================== TIER 6 GEAR - INFERNAL ====================

  armor_infernal: {
    id: "armor_infernal",
    name: "Infernal Armor",
    type: "wearable",
    category: "armor",
    slot: "armor",
    stats: {
      maxHealth: 60,
      armor: 30,
      speed: 15,
      attackStrength: 10,
    },
    effects: [],
    icon: animatedIcon("armor", "infernal"),
    animatedSprite: animatedSprite("armor", "infernal"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 5000,
    description:
      "Demonic armor from the depths of hell (+60 health, +30 armor, +15 speed, +10 attack)",
  },

  helmet_infernal: {
    id: "helmet_infernal",
    name: "Infernal Helm",
    type: "wearable",
    category: "helmet",
    slot: "helmet",
    stats: {
      maxHealth: 40,
      armor: 20,
      attackStrength: 8,
    },
    effects: [],
    icon: animatedIcon("helmet", "infernal"),
    animatedSprite: animatedSprite("helmet", "infernal"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 4000,
    description:
      "A cursed helm wreathed in flames (+40 health, +20 armor, +8 attack)",
  },

  boots_infernal: {
    id: "boots_infernal",
    name: "Infernal Boots",
    type: "wearable",
    category: "boots",
    slot: "boots",
    stats: {
      maxHealth: 30,
      armor: 15,
      speed: 30,
    },
    effects: [],
    icon: animatedIcon("boots", "infernal"),
    animatedSprite: animatedSprite("boots", "infernal"),
    staticWearableSprite: null,
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 3500,
    description:
      "Boots that leave scorched earth (+30 health, +15 armor, +30 speed)",
  },

  shield_infernal: {
    id: "shield_infernal",
    name: "Infernal Aegis",
    type: "wearable",
    category: "shield",
    slot: "shield",
    stats: {
      maxHealth: 50,
      armor: 25,
      attackStrength: 5,
    },
    effects: [],
    icon: staticIcon("shield", "shield_infernal"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("shield", "shield_infernal"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 4500,
    description:
      "An unholy shield radiating dark power (+50 health, +25 armor, +5 attack)",
  },

  weapon_infernal_blade: {
    id: "weapon_infernal_blade",
    name: "Infernal Demonblade",
    type: "wearable",
    category: "weapon",
    slot: "weapon",
    stats: {
      attackStrength: 80,
    },
    effects: [],
    icon: staticIcon("weapon", "weapon_infernal_blade"),
    animatedSprite: null,
    staticWearableSprite: staticWearable("weapon", "weapon_infernal_blade"),
    wearable: true,
    visible: true,
    stackable: false,
    maxStack: 1,
    price: 4800,
    description: "A blade of pure destruction (+80 attack strength)",
  },

  // ==================== ADDITIONAL RINGS ====================

  ring_vitality: {
    id: "ring_vitality",
    name: "Ring of Vitality",
    type: "wearable",
    category: "ring",
    slot: "ring",
    stats: {
      maxHealth: 10,
    },
    effects: [],
    icon: staticIcon("ring", "ring_vitality"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 200,
    description: "A ring that enhances vitality (+10 max health)",
  },

  ring_swiftness: {
    id: "ring_swiftness",
    name: "Ring of Swiftness",
    type: "wearable",
    category: "ring",
    slot: "ring",
    stats: {
      speed: 15,
    },
    effects: [],
    icon: staticIcon("ring", "ring_swiftness"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 250,
    description: "A ring that increases movement speed (+15 speed)",
  },

  ring_power: {
    id: "ring_power",
    name: "Ring of Power",
    type: "wearable",
    category: "ring",
    slot: "ring",
    stats: {
      attackStrength: 5,
      armor: 3,
    },
    effects: [],
    icon: staticIcon("ring", "ring_power"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 400,
    description: "A ring of great power (+5 attack strength, +3 armor)",
  },

  ring_ancient: {
    id: "ring_ancient",
    name: "Ancient Ring",
    type: "wearable",
    category: "ring",
    slot: "ring",
    stats: {
      maxHealth: 15,
      attackStrength: 8,
      armor: 5,
      speed: 10,
    },
    effects: [],
    icon: staticIcon("ring", "ring_ancient"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 1000,
    description:
      "An ancient ring of legendary power (+15 health, +8 attack, +5 armor, +10 speed)",
  },

  // ==================== ADDITIONAL AMULETS ====================

  amulet_protection: {
    id: "amulet_protection",
    name: "Amulet of Protection",
    type: "wearable",
    category: "amulet",
    slot: "amulet",
    stats: {
      maxHealth: 20,
      armor: 8,
    },
    effects: [],
    icon: staticIcon("amulet", "amulet_protection"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 300,
    description: "An amulet that grants protection (+20 max health, +8 armor)",
  },

  amulet_fury: {
    id: "amulet_fury",
    name: "Amulet of Fury",
    type: "wearable",
    category: "amulet",
    slot: "amulet",
    stats: {
      attackStrength: 12,
      speed: 10,
    },
    effects: [],
    icon: staticIcon("amulet", "amulet_fury"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 350,
    description:
      "An amulet that channels battle fury (+12 attack strength, +10 speed)",
  },

  amulet_archon: {
    id: "amulet_archon",
    name: "Amulet of the Archon",
    type: "wearable",
    category: "amulet",
    slot: "amulet",
    stats: {
      maxHealth: 30,
      attackStrength: 15,
      armor: 12,
      speed: 15,
    },
    effects: [],
    icon: staticIcon("amulet", "amulet_archon"),
    animatedSprite: null,
    staticWearableSprite: null,
    wearable: true,
    visible: false,
    stackable: false,
    maxStack: 1,
    price: 1500,
    description:
      "The pinnacle of mystical jewelry (+30 health, +15 attack, +12 armor, +15 speed)",
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
    icon: itemIcon("item_potion_health"), // UI display only
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
    icon: currencyIcon("item_gold_coin"), // UI display only
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
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
