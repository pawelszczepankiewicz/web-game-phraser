/**
 * GameStateManager - Manages game world state
 */
export class GameStateManager {
  constructor(playerManager) {
    this.playerManager = playerManager;
    this.monsters = new Map(); // monsterId -> Monster data
    this.nextMonsterId = 0;
    this.tickRate = 60; // Server tick rate (updates per second)
    this.lastTick = Date.now();
  }

  /**
   * Start game loop
   */
  start(io) {
    this.io = io;
    this.gameLoop = setInterval(() => this.tick(), 1000 / this.tickRate);
    console.log(`Game loop started at ${this.tickRate} ticks/second`);
  }

  /**
   * Stop game loop
   */
  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      console.log('Game loop stopped');
    }
  }

  /**
   * Main game tick
   */
  tick() {
    const now = Date.now();
    const deltaTime = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // Update monsters (AI, combat, etc.)
    this.updateMonsters(deltaTime);

    // Update combat
    this.updateCombat(deltaTime);

    // Broadcast state updates to clients
    this.broadcastStateUpdates();
  }

  /**
   * Update monsters
   */
  updateMonsters(deltaTime) {
    // Monster AI and movement will be implemented here
    // For now, this is a placeholder
  }

  /**
   * Update combat
   */
  updateCombat(deltaTime) {
    // Combat calculations will be implemented here
    // For now, this is a placeholder
  }

  /**
   * Broadcast state updates to clients
   */
  broadcastStateUpdates() {
    // Group players by map for efficient broadcasting
    const playersByMap = new Map();

    this.playerManager.getAllPlayers().forEach(player => {
      if (!playersByMap.has(player.map)) {
        playersByMap.set(player.map, []);
      }
      playersByMap.get(player.map).push(player);
    });

    // Broadcast to each map
    playersByMap.forEach((players, mapKey) => {
      const stateUpdate = {
        players: players.map(p => p.getState()),
        monsters: this.getMonstersOnMap(mapKey)
      };

      // Send to all players on this map
      players.forEach(player => {
        player.socket.emit('state-update', stateUpdate);
      });
    });
  }

  /**
   * Get monsters on a specific map
   */
  getMonstersOnMap(mapKey) {
    return Array.from(this.monsters.values())
      .filter(m => m.map === mapKey);
  }

  /**
   * Spawn a monster
   */
  spawnMonster(monsterData) {
    const monsterId = this.nextMonsterId++;
    this.monsters.set(monsterId, {
      id: monsterId,
      ...monsterData,
      health: monsterData.maxHealth
    });
    return monsterId;
  }

  /**
   * Remove a monster
   */
  removeMonster(monsterId) {
    this.monsters.delete(monsterId);
  }
}
