/**
 * Shared constants for the MMO game
 * Used by both client and server
 */

// Combat
export const ATTACK_RANGE = 100; // Distance in pixels for melee attacks
export const ATTACK_COOLDOWN_DEFAULT = 500; // Default attack cooldown in ms

// Interest management (what players can see)
export const INTEREST_RANGE = 2000; // Pixels - how far players can see other entities

// Loot system
export const LOOT_BAG_DESPAWN_TIME = 60000; // 60 seconds
export const LOOT_PICKUP_RANGE = 100; // Must be within this range to pickup loot

// Player
export const PLAYER_DEFAULT_SPEED = 150;
export const PLAYER_MAX_SPEED = 300; // For speed hack detection
export const PLAYER_DEFAULT_STATS = {
  health: 10,
  maxHealth: 10,
  attackStrength: 1,
  armor: 1,
};

// Inventory
export const MAX_BACKPACK_SLOTS = 40;
export const GOLD_MAX_STACK = 1000;

// Timers
export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
export const SERVER_TICK_RATE = 60; // Updates per second
export const POSITION_UPDATE_THRESHOLD = 5; // Pixels - minimum movement to broadcast

// Monster respawn
export const MONSTER_DEFAULT_RESPAWN_TIME = 30000; // 30 seconds

// Validation
export const MAX_POSITION_DELTA_PER_TICK = 10; // Max pixels player can move per server tick
export const TELEPORT_THRESHOLD = 200; // If player moves more than this in one update, flag as teleport
