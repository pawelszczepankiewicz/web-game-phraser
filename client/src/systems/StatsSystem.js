/**
 * StatsSystem - Manages character statistics
 * Designed to be easily extensible with new stats
 */
export class StatsSystem {
  constructor(scene, initialStats) {
    this.scene = scene;
    this.stats = {
      health: 100,
      maxHealth: 100,
      attackStrength: 10,
      armor: 5,
      // Extensible for future stats:
      // level: 1,
      // experience: 0,
      // mana: 100,
      // maxMana: 100,
      // attackSpeed: 1.0,
      // dexterity: 10,
      // fireResistance: 0,
      // iceResistance: 0,
      // guild: null,
      ...initialStats
    };

    // Listeners for stat changes
    this.listeners = [];
  }

  /**
   * Get a stat value
   */
  getStat(statName) {
    return this.stats[statName] || 0;
  }

  /**
   * Set a stat value
   */
  setStat(statName, value) {
    const oldValue = this.stats[statName];
    this.stats[statName] = value;

    // Enforce constraints
    if (statName === 'health' && value > this.stats.maxHealth) {
      this.stats.health = this.stats.maxHealth;
    }

    // Notify listeners
    this.notifyListeners(statName, oldValue, this.stats[statName]);
  }

  /**
   * Modify a stat by a delta amount
   */
  modifyStat(statName, delta) {
    const currentValue = this.getStat(statName);
    this.setStat(statName, currentValue + delta);
  }

  /**
   * Get all stats
   */
  getAllStats() {
    return { ...this.stats };
  }

  /**
   * Update stats (called from scene update)
   */
  update() {
    // Future: Handle stat regeneration, status effects, etc.
  }

  /**
   * Add listener for stat changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of stat change
   */
  notifyListeners(statName, oldValue, newValue) {
    this.listeners.forEach(callback => {
      callback(statName, oldValue, newValue);
    });
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    const damageAfterArmor = Math.max(1, amount - this.stats.armor);
    this.modifyStat('health', -damageAfterArmor);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.onDeath();
    }

    return damageAfterArmor;
  }

  /**
   * Heal
   */
  heal(amount) {
    this.modifyStat('health', amount);
  }

  /**
   * Handle death
   */
  onDeath() {
    // Future: Handle player death (respawn, etc.)
    console.log('Player died!');
  }

  /**
   * Export stats for saving
   */
  exportStats() {
    return { ...this.stats };
  }

  /**
   * Import stats from save data
   */
  importStats(stats) {
    this.stats = { ...this.stats, ...stats };
    this.notifyListeners('all', null, this.stats);
  }
}
