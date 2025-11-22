/**
 * Player - Server-side player state
 */
export class Player {
  constructor(userId, characterData, socket) {
    this.userId = userId;
    this.socketId = socket.id;
    this.socket = socket;

    // Character data from Firestore
    this.name = characterData.name;
    this.map = characterData.map || 'starting_map';
    this.x = characterData.x || 500;
    this.y = characterData.y || 500;

    // Stats
    this.stats = characterData.stats || {
      health: 100,
      maxHealth: 100,
      attackStrength: 10,
      armor: 5
    };

    // Inventory
    this.inventory = characterData.inventory || {
      backpack: [],
      equipped: {
        helmet: null,
        armor: null,
        weapon: null,
        shield: null
      }
    };

    // Quests
    this.quests = characterData.quests || {
      active: [],
      completed: []
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
        equipped: this.inventory.equipped
      }
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
      quests: this.quests
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
}
