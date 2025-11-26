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
  start(io, lootBagManager) {
    this.io = io;
    this.lootBagManager = lootBagManager;
    this.gameLoop = setInterval(() => this.tick(), 1000 / this.tickRate);
  }

  /**
   * Stop game loop
   */
  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
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

    // Check for loot bag despawns
    if (this.lootBagManager) {
      this.checkLootBagDespawns();
    }

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
   * Check for loot bags that should despawn
   */
  checkLootBagDespawns() {
    const despawned = this.lootBagManager.checkDespawns();

    // Broadcast despawns to players on the same map
    despawned.forEach((lootBag) => {
      const playersOnMap = this.playerManager.getPlayersOnMap(lootBag.map);
      playersOnMap.forEach((player) => {
        player.socket.emit("loot-bag-despawned", { lootBagId: lootBag.id });
      });
    });
  }

  /**
   * Broadcast state updates to clients (with interest-based filtering)
   */
  broadcastStateUpdates() {
    const interestRange = parseInt(process.env.INTEREST_RANGE) || 500;
    const playersByMap = new Map();

    for (const player of this.playerManager.getAllPlayers()) {
      if (!playersByMap.has(player.map)) {
        playersByMap.set(player.map, []);
      }
      playersByMap.get(player.map).push(player);
    }

    playersByMap.forEach((players, mapKey) => {
      const monsters = this.getMonstersOnMap(mapKey);

      players.forEach((player) => {
        const nearbyPlayers = this.playerManager
          .getPlayersInRange(player.x, player.y, interestRange, mapKey)
          .filter((p) => p.userId !== player.userId);

        const nearbyMonsters = monsters.filter((monster) => {
          const dx = monster.x - player.x;
          const dy = monster.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance <= interestRange;
        });

        const stateUpdate = {
          players: nearbyPlayers.map((p) => p.getState()),
          monsters: nearbyMonsters,
        };

        player.socket.emit("state-update", stateUpdate);
      });
    });
  }

  /**
   * Get monsters on a specific map
   */
  getMonstersOnMap(mapKey) {
    return Array.from(this.monsters.values()).filter((m) => m.map === mapKey);
  }

  /**
   * Spawn a monster
   */
  spawnMonster(monsterData) {
    const monsterId = this.nextMonsterId++;
    this.monsters.set(monsterId, {
      id: monsterId,
      ...monsterData,
      health: monsterData.maxHealth,
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
