import { getItem } from "../../../shared/data/Items.js";
import { PLAYER_DEFAULT_STATS } from "../../../shared/constants.js";

/**
 * Player - Server-side player state
 * Default stats come from shared/constants.js PLAYER_DEFAULT_STATS
 */
export class Player {
  constructor(userId, characterData, socket) {
    this.userId = userId;
    this.socketId = socket.id;
    this.socket = socket;

    // Character data from Firestore
    this.name = characterData.name;
    this.map = characterData.map || "starting_map";
    this.x = characterData.x || 500;
    this.y = characterData.y || 500;

    // Stats - defaults from shared/constants.js
    this.stats = characterData.stats || { ...PLAYER_DEFAULT_STATS };

    // Inventory
    this.inventory = characterData.inventory || {
      backpack: [],
      equipped: {
        helmet: null,
        armor: null,
        weapon: null,
        shield: null,
      },
    };

    // Quests
    this.quests = characterData.quests || {
      active: [],
      completed: [],
    };

    // Runtime state
    this.velocityX = 0;
    this.velocityY = 0;
    this.lastUpdate = Date.now();
    this.inCombat = false;
    this.targetMonster = null;
  }

  /**
   * Update player position
   */
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    this.lastUpdate = Date.now();
  }

  /**
   * Update player velocity
   */
  updateVelocity(velocityX, velocityY) {
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  /**
   * Get player state for broadcasting to other clients
   */
  getState() {
    return {
      userId: this.userId,
      name: this.name,
      x: this.x,
      y: this.y,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      stats: this.stats,
      inventory: {
        equipped: this.inventory.equipped,
      },
    };
  }

  /**
   * Get full player data for persistence
   */
  getFullData() {
    return {
      name: this.name,
      map: this.map,
      x: this.x,
      y: this.y,
      stats: this.stats,
      inventory: this.inventory,
      quests: this.quests,
    };
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    const damage = Math.max(1, amount - this.stats.armor);
    this.stats.health = Math.max(0, this.stats.health - damage);
    return damage;
  }

  /**
   * Heal
   */
  heal(amount) {
    const oldHealth = this.stats.health;
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    return this.stats.health - oldHealth;
  }

  /**
   * Check if player is alive
   */
  isAlive() {
    return this.stats.health > 0;
  }

  /**
   * Get equipped weapon data
   * @returns {Object|null} Weapon item data or null
   */
  getEquippedWeapon() {
    const weaponSlot = this.inventory.equipped?.weapon;
    if (!weaponSlot) return null;

    // weaponSlot contains the instanceId or itemId
    const itemId = weaponSlot.itemId || weaponSlot;
    return getItem(itemId);
  }

  /**
   * Check if player has a ranged weapon equipped
   * @returns {boolean}
   */
  hasRangedWeapon() {
    const weapon = this.getEquippedWeapon();
    return weapon && weapon.weaponType === "ranged" && weapon.rangedAttack;
  }

  /**
   * Get ranged attack configuration from equipped weapon
   * @returns {Object|null} Ranged attack config or null
   */
  getRangedAttackConfig() {
    const weapon = this.getEquippedWeapon();
    if (!weapon || weapon.weaponType !== "ranged" || !weapon.rangedAttack) {
      return null;
    }
    return {
      ...weapon.rangedAttack,
      damage: this.stats.attackStrength, // Use player's attack strength (includes weapon bonus)
    };
  }
}
