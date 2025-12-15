import { MonsterManager } from "./MonsterManager.js";
import { ProjectileManager } from "./ProjectileManager.js";
import { INTEREST_RANGE, SERVER_TICK_RATE, ATTACK_RANGE } from "../../../shared/constants.js";
import { rollMonsterLoot } from "../../../shared/data/Monsters.js";

/**
 * GameStateManager - Manages game world state
 * Server-authoritative game loop handling monsters, combat, projectiles, and state synchronization
 */
export class GameStateManager {
  constructor(playerManager) {
    this.playerManager = playerManager;
    this.monsterManager = new MonsterManager(playerManager);
    this.projectileManager = new ProjectileManager(playerManager);
    // Give projectile manager access to monster manager for collision detection
    this.projectileManager.setMonsterManager(this.monsterManager);
    this.tickRate = SERVER_TICK_RATE;
    this.lastTick = Date.now();
    this.io = null;
    this.lootBagManager = null;
  }

  /**
   * Start game loop
   */
  start(io, lootBagManager) {
    this.io = io;
    this.lootBagManager = lootBagManager;
    this.gameLoop = setInterval(() => this.tick(), 1000 / this.tickRate);
    console.log(`[GameStateManager] Game loop started at ${this.tickRate} ticks/second`);
  }

  /**
   * Stop game loop
   */
  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      console.log("[GameStateManager] Game loop stopped");
    }
  }

  /**
   * Main game tick
   */
  tick() {
    const now = Date.now();
    const deltaTime = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // Update monsters and get any attacks
    const monsterAttacks = this.monsterManager.update(deltaTime);

    // Process monster attacks on players (melee and ranged)
    this.processMonsterAttacks(monsterAttacks);

    // Update projectiles and check collisions
    const { playerHits, monsterHits } = this.projectileManager.update(deltaTime);
    this.processProjectileHits(playerHits);
    this.processProjectileMonsterHits(monsterHits);

    // Check for loot bag despawns
    if (this.lootBagManager) {
      this.checkLootBagDespawns();
    }

    // Broadcast state updates to clients
    this.broadcastStateUpdates();
  }

  /**
   * Process monster attacks on players
   * @param {Array} attacks - Array of attack results from monsters
   */
  processMonsterAttacks(attacks) {
    for (const attack of attacks) {
      if (attack.type === "ranged") {
        // Ranged attack - create projectiles
        this.createProjectilesFromAttack(attack);
      } else {
        // Melee attack - apply damage directly
        const player = this.playerManager.getPlayer(attack.targetUserId);
        if (!player || !player.isAlive()) continue;

        // Apply damage to player
        const actualDamage = player.takeDamage(attack.damage);

        // Notify the attacked player
        player.socket.emit("player-damaged", {
          damage: actualDamage,
          health: player.stats.health,
          maxHealth: player.stats.maxHealth,
          attackerId: attack.monsterId,
          attackerType: "monster",
        });

        // Check if player died
        if (!player.isAlive()) {
          this.handlePlayerDeath(player, attack.monsterId);
        }
      }
    }
  }

  /**
   * Create projectiles from a ranged attack
   * @param {Object} attack - Ranged attack data
   */
  createProjectilesFromAttack(attack) {
    const monster = attack.monster;
    const target = this.playerManager.getPlayer(attack.targetUserId);

    if (!target || !target.isAlive()) return;

    // Create projectiles based on pattern
    const projectiles = this.projectileManager.createProjectilesFromPattern(
      monster,
      target,
      attack.rangedConfig
    );

    // Broadcast projectile creation to all players on the map
    const playersOnMap = this.playerManager.getPlayersOnMap(monster.map);
    playersOnMap.forEach((player) => {
      player.socket.emit("projectiles-created", {
        projectiles: projectiles.map((p) => p.getState()),
      });
    });
  }

  /**
   * Process projectile hits on players
   * @param {Array} hits - Array of hit results { projectile, player, damage }
   */
  processProjectileHits(hits) {
    for (const hit of hits) {
      const player = hit.player;
      if (!player || !player.isAlive()) continue;

      // Apply damage to player
      const actualDamage = player.takeDamage(hit.damage);

      // Notify the attacked player
      player.socket.emit("player-damaged", {
        damage: actualDamage,
        health: player.stats.health,
        maxHealth: player.stats.maxHealth,
        attackerId: hit.projectile.ownerId,
        attackerType: "projectile",
        projectileType: hit.projectile.type,
      });

      // Broadcast projectile hit to all players on the map
      const playersOnMap = this.playerManager.getPlayersOnMap(player.map);
      playersOnMap.forEach((p) => {
        p.socket.emit("projectile-hit", {
          projectileId: hit.projectile.id,
          targetUserId: player.userId,
          damage: actualDamage,
        });
      });

      // Check if player died
      if (!player.isAlive()) {
        this.handlePlayerDeath(player, hit.projectile.ownerId);
      }
    }
  }

  /**
   * Process player projectile hits on monsters
   * @param {Array} hits - Array of hit results { projectile, monster, damage, attackerId }
   */
  processProjectileMonsterHits(hits) {
    for (const hit of hits) {
      const monster = hit.monster;
      if (!monster || !monster.active) continue;

      // Get the attacking player
      const attacker = this.playerManager.getPlayer(hit.attackerId);
      if (!attacker) continue;

      // Apply damage to monster
      const result = monster.takeDamage(hit.damage, hit.attackerId);

      if (result.hit) {
        // Broadcast damage to all players on map
        const playersOnMap = this.playerManager.getPlayersOnMap(monster.map);
        playersOnMap.forEach((p) => {
          // Emit monster-damaged event
          p.socket.emit("monster-damaged", {
            monsterId: monster.id,
            damage: result.damage,
            health: result.health,
            maxHealth: result.maxHealth,
            attackerId: hit.attackerId,
          });

          // Emit projectile-hit event for visual feedback
          p.socket.emit("projectile-hit", {
            projectileId: hit.projectile.id,
            targetMonsterId: monster.id,
            damage: result.damage,
          });
        });

        // Handle monster death
        if (result.killed) {
          this.handleMonsterDeath(monster, attacker);
        }
      }
    }
  }

  /**
   * Handle player death
   * @param {Player} player - The player who died
   * @param {string} killerId - ID of the entity that killed the player
   */
  handlePlayerDeath(player, killerId) {
    console.log(`[GameStateManager] Player ${player.name} was killed by ${killerId}`);

    // Emit death event to the player
    player.socket.emit("player-died", {
      killerId: killerId,
      killerType: "monster",
    });

    // Notify other players on the map
    const playersOnMap = this.playerManager.getPlayersOnMap(player.map);
    playersOnMap.forEach((p) => {
      if (p.userId !== player.userId) {
        p.socket.emit("other-player-died", {
          userId: player.userId,
          killerId: killerId,
        });
      }
    });
  }

  /**
   * Handle player attack on monster (called from socket handler)
   * Automatically determines if it's a melee or ranged attack based on equipped weapon
   * @param {Player} player - The attacking player
   * @param {string} monsterId - Target monster ID
   * @returns {Object} Result of the attack
   */
  handlePlayerAttack(player, monsterId) {
    const monster = this.monsterManager.getMonster(monsterId);

    if (!monster) {
      return { success: false, reason: "monster_not_found" };
    }

    if (!monster.active) {
      return { success: false, reason: "monster_dead" };
    }

    // Check if player is on the same map as monster
    if (player.map !== monster.map) {
      return { success: false, reason: "wrong_map" };
    }

    // Calculate distance to target
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check if player has ranged weapon - if so, use ranged attack
    if (player.hasRangedWeapon()) {
      return this.handlePlayerRangedAttack(player, monster, dist);
    }

    // Melee attack - check melee range
    if (dist > ATTACK_RANGE) {
      return { success: false, reason: "out_of_range" };
    }

    // Calculate damage (server-authoritative)
    const damage = player.stats.attackStrength;
    const result = monster.takeDamage(damage, player.userId);

    if (result.hit) {
      // Broadcast damage to all players on map
      const playersOnMap = this.playerManager.getPlayersOnMap(player.map);
      playersOnMap.forEach((p) => {
        p.socket.emit("monster-damaged", {
          monsterId: monster.id,
          damage: result.damage,
          health: result.health,
          maxHealth: result.maxHealth,
          attackerId: player.userId,
        });
      });

      // Handle monster death
      if (result.killed) {
        this.handleMonsterDeath(monster, player);
      }
    }

    return {
      success: true,
      damage: result.damage,
      killed: result.killed,
    };
  }

  /**
   * Handle player ranged attack on monster
   * @param {Player} player - The attacking player
   * @param {Monster} monster - Target monster
   * @param {number} dist - Distance to target
   * @returns {Object} Result of the attack
   */
  handlePlayerRangedAttack(player, monster, dist) {
    const rangedConfig = player.getRangedAttackConfig();

    if (!rangedConfig) {
      return { success: false, reason: "no_ranged_weapon" };
    }

    // Check ranged attack range
    if (dist > rangedConfig.range) {
      return { success: false, reason: "out_of_range" };
    }

    // Create projectile targeting the monster
    const projectile = this.projectileManager.createProjectile({
      x: player.x,
      y: player.y,
      targetX: monster.x,
      targetY: monster.y,
      speed: rangedConfig.projectile.speed,
      damage: rangedConfig.damage,
      ownerId: player.userId,
      ownerType: "player",
      targetMonsterId: monster.id,
      type: rangedConfig.projectile.type,
      width: rangedConfig.projectile.width,
      height: rangedConfig.projectile.height,
      maxRange: rangedConfig.range,
      map: player.map,
    });

    // Broadcast projectile creation to all players on the map
    const playersOnMap = this.playerManager.getPlayersOnMap(player.map);
    playersOnMap.forEach((p) => {
      p.socket.emit("projectiles-created", {
        projectiles: [projectile.getState()],
      });
    });

    return {
      success: true,
      attackType: "ranged",
      projectileId: projectile.id,
    };
  }

  /**
   * Handle player ranged attack at a position (no specific target)
   * Fires a projectile toward the target location
   * @param {Player} player - The attacking player
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {Object} Result of the attack
   */
  handlePlayerRangedAttackPosition(player, targetX, targetY) {
    const rangedConfig = player.getRangedAttackConfig();

    if (!rangedConfig) {
      return { success: false, reason: "no_ranged_weapon" };
    }

    // Calculate distance to target position
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check ranged attack range
    if (dist > rangedConfig.range) {
      return { success: false, reason: "out_of_range" };
    }

    // Create projectile toward the target position
    const projectile = this.projectileManager.createProjectile({
      x: player.x,
      y: player.y,
      targetX: targetX,
      targetY: targetY,
      speed: rangedConfig.projectile.speed,
      damage: rangedConfig.damage,
      ownerId: player.userId,
      ownerType: "player",
      type: rangedConfig.projectile.type,
      width: rangedConfig.projectile.width,
      height: rangedConfig.projectile.height,
      maxRange: rangedConfig.range,
      map: player.map,
    });

    // Broadcast projectile creation to all players on the map
    const playersOnMap = this.playerManager.getPlayersOnMap(player.map);
    playersOnMap.forEach((p) => {
      p.socket.emit("projectiles-created", {
        projectiles: [projectile.getState()],
      });
    });

    return {
      success: true,
      attackType: "ranged",
      projectileId: projectile.id,
    };
  }

  /**
   * Handle monster death
   * @param {Monster} monster - The monster that died
   * @param {Player} killer - The player who killed it
   */
  handleMonsterDeath(monster, killer) {
    console.log(`[GameStateManager] ${monster.monsterType} killed by ${killer.name}`);

    // Roll loot (server-side)
    const loot = this.rollLoot(monster);

    // Create loot bag if there's loot
    let lootBagData = null;
    if (loot.length > 0 && this.lootBagManager) {
      const lootBag = this.lootBagManager.createLootBag(monster.x, monster.y, loot, monster.map);
      lootBagData = lootBag.getState();
    }

    // Update quest progress for the killer
    let questUpdates = [];
    if (this.questManager) {
      // Record the kill
      this.questManager.recordKill(killer.userId, monster.monsterType);

      // Update quest objectives
      questUpdates = this.questManager.onMonsterKilled(killer, monster.monsterType);

      // Notify killer of quest progress
      if (questUpdates.length > 0) {
        killer.socket.emit("quest-progress", {
          monsterType: monster.monsterType,
          updatedQuests: questUpdates,
          quests: killer.quests,
        });

        // Save quest progress
        this.playerManager.savePlayer(killer.userId);
      }
    }

    // Notify all players on map
    const playersOnMap = this.playerManager.getPlayersOnMap(monster.map);
    playersOnMap.forEach((p) => {
      p.socket.emit("monster-died", {
        monsterId: monster.id,
        monsterType: monster.monsterType,
        killerId: killer.userId,
        x: monster.x,
        y: monster.y,
      });

      if (lootBagData) {
        p.socket.emit("loot-bag-created", lootBagData);
      }
    });

    // Tell monster manager to handle respawn
    this.monsterManager.onMonsterDeath(monster);
  }

  /**
   * Roll loot from monster (server-authoritative)
   * @param {Monster} monster - The monster that died
   * @returns {Array} Array of item drops
   */
  rollLoot(monster) {
    return rollMonsterLoot(monster.monsterType);
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
    const interestRange = INTEREST_RANGE;
    const playersByMap = new Map();

    // Group players by map
    for (const player of this.playerManager.getAllPlayers()) {
      if (!playersByMap.has(player.map)) {
        playersByMap.set(player.map, []);
      }
      playersByMap.get(player.map).push(player);
    }

    // For each map with players, broadcast state
    playersByMap.forEach((players, mapKey) => {
      // Ensure monsters are initialized for this map
      this.monsterManager.initializeMap(mapKey);

      players.forEach((player) => {
        // Get nearby players
        const nearbyPlayers = this.playerManager
          .getPlayersInRange(player.x, player.y, interestRange, mapKey)
          .filter((p) => p.userId !== player.userId);

        // Get nearby monsters from MonsterManager
        const nearbyMonsters = this.monsterManager.getMonstersInRange(
          player.x,
          player.y,
          interestRange,
          mapKey
        );

        // Get nearby projectiles from ProjectileManager
        const nearbyProjectiles = this.projectileManager.getProjectilesInRange(
          player.x,
          player.y,
          interestRange,
          mapKey
        );

        // Build state update
        const stateUpdate = {
          players: nearbyPlayers.map((p) => p.getState()),
          monsters: nearbyMonsters.map((m) => m.getState()),
          projectiles: nearbyProjectiles.map((p) => p.getState()),
        };

        player.socket.emit("state-update", stateUpdate);
      });
    });
  }

  /**
   * Get monster manager (for external access)
   */
  getMonsterManager() {
    return this.monsterManager;
  }

  /**
   * Get monster by ID (convenience method)
   */
  getMonster(monsterId) {
    return this.monsterManager.getMonster(monsterId);
  }

  /**
   * Get monsters on map (convenience method)
   */
  getMonstersOnMap(mapKey) {
    return this.monsterManager.getMonstersOnMap(mapKey);
  }
}
