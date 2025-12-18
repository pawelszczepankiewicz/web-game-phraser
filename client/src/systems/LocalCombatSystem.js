import { ATTACK_RANGE } from "../shared/constants.js";
import { distance, isInRange } from "../shared/utils/geometry.js";

/**
 * LocalCombatSystem - Handles local combat calculations for single-player
 * Processes damage between player and monsters
 */
export class LocalCombatSystem {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Handle player attacking a monster
   * @param {Player} player - The player entity
   * @param {LocalMonster} monster - The target monster
   * @returns {Object} Result of the attack
   */
  handlePlayerAttack(player, monster) {
    if (!player || !monster || !monster.active) {
      return { success: false, reason: "invalid_target" };
    }

    // Check range
    const dist = distance(player.x, player.y, monster.x, monster.y);
    if (dist > ATTACK_RANGE) {
      return { success: false, reason: "out_of_range" };
    }

    // Get player's attack strength from stats system
    const attackStrength = this.scene.statsSystem.getStat("attackStrength");

    // Apply damage to monster
    const result = monster.takeDamage(attackStrength, "player");

    // Play hit sound
    if (result.hit && this.scene.soundManager) {
      this.scene.soundManager.play("hit_melee");
    }

    // If monster died, notify monster manager
    if (result.killed) {
      this.scene.localMonsterManager.onMonsterDeath(monster);
    }

    return {
      success: result.hit,
      damage: result.damage,
      killed: result.killed,
      reason: result.hit ? null : result.reason,
    };
  }

  /**
   * Handle monster attacking player
   * @param {Object} attackResult - Attack result from monster AI
   */
  handleMonsterAttack(attackResult) {
    if (!attackResult || attackResult.type !== "melee") return;

    const player = attackResult.target;
    if (!player || !player.active) return;

    // Use StatsSystem.takeDamage with attacker strength for block calculation
    // Monster's attackStrength is the damage value
    const result = this.scene.statsSystem.takeDamage(attackResult.damage, attackResult.damage);

    if (result.blocked) {
      // Show block effect on player
      if (player.showBlockEffect) {
        player.showBlockEffect();
      }
      // Play block sound
      if (this.scene.soundManager) {
        this.scene.soundManager.play("block");
      }
      return;
    }

    // Show damage effect on player
    if (player.showDamageEffect) {
      player.showDamageEffect(result.damage);
    }

    // Play damage sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play("player_hurt");
    }
  }

  /**
   * Handle ranged attack from monster
   * @param {Object} attackResult - Ranged attack result from monster AI
   */
  handleMonsterRangedAttack(attackResult) {
    if (!attackResult || attackResult.type !== "ranged") return;

    // Create projectiles through projectile manager
    if (this.scene.projectileManager) {
      this.scene.projectileManager.createProjectilesFromMonster(
        attackResult.monster,
        attackResult.targetX,
        attackResult.targetY,
        attackResult.rangedConfig
      );
    }
  }

  /**
   * Handle projectile hitting player
   * @param {Projectile} projectile - The projectile that hit
   * @param {number} damage - Damage to apply
   */
  handleProjectileHitPlayer(projectile, damage) {
    const player = this.scene.player;
    if (!player || !player.active) return;

    // Use StatsSystem.takeDamage with attacker strength for block calculation
    // Projectile damage equals attacker strength
    const result = this.scene.statsSystem.takeDamage(damage, damage);

    if (result.blocked) {
      // Show block effect on player
      if (player.showBlockEffect) {
        player.showBlockEffect();
      }
      // Play block sound
      if (this.scene.soundManager) {
        this.scene.soundManager.play("block");
      }
      return;
    }

    // Show damage effect on player
    if (player.showDamageEffect) {
      player.showDamageEffect(result.damage);
    }

    // Play damage sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play("player_hurt");
    }
  }

  /**
   * Handle projectile hitting monster
   * @param {Projectile} projectile - The projectile that hit
   * @param {LocalMonster} monster - The monster that was hit
   * @param {number} damage - Damage to apply
   */
  handleProjectileHitMonster(projectile, monster, damage) {
    if (!monster || !monster.active) return;

    // Apply damage to monster
    const result = monster.takeDamage(damage, "player");

    // Play hit sound
    if (result.hit && this.scene.soundManager) {
      this.scene.soundManager.play("hit_melee");
    }

    // If monster died, notify monster manager
    if (result.killed) {
      this.scene.localMonsterManager.onMonsterDeath(monster);
    }
  }

  /**
   * Process all attack results from monster updates
   * @param {Array} attackResults - Array of attack results from monsters
   */
  processAttackResults(attackResults) {
    for (const result of attackResults) {
      if (result.type === "melee") {
        this.handleMonsterAttack(result);
      } else if (result.type === "ranged") {
        this.handleMonsterRangedAttack(result);
      }
    }
  }
}
