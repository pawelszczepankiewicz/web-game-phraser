# CLAUDE.md - AI Development Guide

This document provides comprehensive information for AI assistants working on this Phaser single-player RPG game.

## Project Overview

A 2D isometric single-player RPG built with:
- **Client**: Phaser 3 + Vue 3 + Pinia (Vite bundled)
- **Database**: Firebase Auth + Firestore (client-side persistence)
- **Maps**: Tiled JSON format (staggered isometric)

## Architecture

This is a **single-player** game. All game logic runs in the browser:
- Monster AI runs locally (LocalMonster, LocalMonsterManager)
- Combat calculations are done client-side (LocalCombatSystem)
- Character data is saved to Firebase Firestore directly from the client
- No server required

## Directory Structure

```
game-web-phaser/
└── client/                      # Phaser 3 game (single-player)
    ├── src/
    │   ├── main.js              # Phaser initialization
    │   ├── scenes/
    │   │   ├── BootScene.js     # Asset loading, auth
    │   │   └── GameScene.js     # Main gameplay
    │   ├── entities/
    │   │   ├── Player.js        # Player entity
    │   │   ├── LocalMonster.js  # Monster with AI
    │   │   ├── Projectile.js    # Projectiles with collision
    │   │   ├── NPC.js           # NPCs
    │   │   └── LootBag.js       # Loot bags
    │   ├── systems/
    │   │   ├── LocalGameLoop.js      # Main game loop coordinator
    │   │   ├── LocalMonsterManager.js # Monster spawning & management
    │   │   ├── LocalCombatSystem.js  # Damage calculations
    │   │   ├── ProjectileManager.js  # Projectile handling
    │   │   ├── MapManager.js         # Tiled map loading
    │   │   ├── InventorySystem.js    # Player inventory
    │   │   ├── StatsSystem.js        # Player stats (single source of truth)
    │   │   ├── QuestSystem.js        # Quest tracking
    │   │   ├── CollisionManager.js   # Map collisions
    │   │   ├── LootBagManager.js     # Loot bag lifecycle
    │   │   ├── NPCManager.js         # NPC management
    │   │   ├── SoundManager.js       # Audio
    │   │   └── FirebasePersistence.js # Save/load to Firestore
    │   ├── utils/
    │   │   ├── VueBridge.js     # Phaser ↔ Vue communication
    │   │   └── TileUtils.js     # Tile collision helpers
    │   ├── config/
    │   │   └── firebase.js      # Firebase client config
    │   ├── shared/              # Game data & utilities
    │   │   ├── constants.js     # Game constants
    │   │   ├── data/
    │   │   │   ├── Monsters.js  # Monster definitions, loot tables
    │   │   │   ├── Items.js     # All items
    │   │   │   ├── Quests.js    # Quest definitions
    │   │   │   └── Traders.js   # NPC shop inventories
    │   │   └── utils/
    │   │       ├── geometry.js  # Distance, point-in-polygon
    │   │       └── random.js    # ID generation
    │   └── vue/
    │       ├── app.js           # Vue + Pinia setup
    │       ├── stores/gameStore.js
    │       └── components/      # UI components
    └── public/
        ├── maps/                # Tiled JSON maps
        └── assets/              # Sprites, tilesets, sounds
```

## Core Systems

### LocalGameLoop (systems/LocalGameLoop.js)

Coordinates all game systems each frame:
```javascript
update(time, delta) {
  // 1. Update monsters (AI, movement, attacks)
  const attackResults = this.updateMonsters(time, delta);

  // 2. Process monster attacks (melee creates damage, ranged creates projectiles)
  this.processMonsterAttacks(attackResults);

  // 3. Update projectiles (movement + collision detection)
  this.updateProjectiles(time, delta);

  // 4. Check loot bag despawns
  this.checkLootBagDespawns();
}
```

### LocalMonster (entities/LocalMonster.js)

Full monster AI with state machine:
- **States**: idle, patrolling, chasing, attacking, casting
- **Behavior**: Patrols within spawn polygon, chases player when in range, attacks when close
- **Ranged**: Some monsters have ranged attacks that create projectiles

### LocalCombatSystem (systems/LocalCombatSystem.js)

Handles all damage calculations:
- `handlePlayerAttack(player, monster)` - Player melee attacks
- `handleMonsterAttack(attackResult)` - Monster melee attacks (uses StatsSystem.takeDamage)
- `handleProjectileHitPlayer(projectile, damage)` - Projectile damage to player
- `handleProjectileHitMonster(projectile, monster, damage)` - Projectile damage to monsters

### StatsSystem (systems/StatsSystem.js)

**Single source of truth** for player stats. Auto-syncs to Vue store.
- `takeDamage(amount)` - Applies damage (with armor), triggers death if health <= 0
- `setStat(name, value)` - Updates stat and syncs to Vue
- `setDeathCallback(fn)` - Called when player dies

### FirebasePersistence (systems/FirebasePersistence.js)

Direct client-to-Firestore persistence:
- `loadCharacter(userId, email)` - Load or create character
- `saveCharacter(data)` - Save character data
- Auto-saves every 30 seconds

## Combat Flow

```
Player clicks monster:
1. Player.attackMonster() called
2. LocalCombatSystem.handlePlayerAttack() validates range, calculates damage
3. LocalMonster.takeDamage() applies damage, shows health bar
4. If killed: LocalMonsterManager.onMonsterDeath() → loot drop, quest update, respawn timer

Monster attacks player:
1. LocalMonster.update() returns attack result
2. LocalCombatSystem.handleMonsterAttack() or handleMonsterRangedAttack()
3. StatsSystem.takeDamage() applies damage, checks for death
4. If health <= 0: StatsSystem.onDeath() → deathCallback → player respawn
```

## Adding New Features

### New Monster Type

Add to `src/shared/data/Monsters.js`:
```javascript
export const MONSTER_TYPES = {
  monster_newtype: {
    name: "New Monster",
    health: 100,
    attackStrength: 15,
    attackRate: 1500,
    attackRadius: 200,
    hitboxWidth: 30,
    hitboxHeight: 40,
    speed: 80,
    lootTable: [
      { itemId: "gold", minQuantity: 5, maxQuantity: 15, dropRate: 1.0 }
    ]
  }
};
```

Then add sprites and spawn objects in Tiled map.

### New Item

Add to `src/shared/data/Items.js`:
```javascript
export const ITEMS = {
  new_item_id: {
    id: "new_item_id",
    name: "New Item",
    type: "equipment",      // or "consumable"
    slot: "weapon",
    stats: { attackStrength: 10 },
    wearable: true,
    price: 100
  }
};
```

### New Quest

Add to `src/shared/data/Quests.js`:
```javascript
export const QUESTS = {
  new_quest_id: {
    id: "new_quest_id",
    name: "New Quest",
    giver: "npc_name",
    objectives: [
      { type: "kill", target: "monster_slime", required: 5, description: "Kill slimes" }
    ],
    rewards: { gold: 50, items: [{ itemId: "some_item", quantity: 1 }] }
  }
};
```

## Constants Reference

From `src/shared/constants.js`:

| Constant | Value | Description |
|----------|-------|-------------|
| `ATTACK_RANGE` | 100 | Pixels for melee attacks |
| `LOOT_BAG_DESPAWN_TIME` | 60000 | 60 seconds |
| `LOOT_PICKUP_RANGE` | 100 | Must be within to pickup |
| `MAX_BACKPACK_SLOTS` | 40 | Inventory limit |
| `AUTO_SAVE_INTERVAL` | 30000 | 30 seconds |
| `MONSTER_DEFAULT_RESPAWN_TIME` | 30000 | 30 seconds |

## Running the Project

```bash
cd client
npm install
npm run dev
```

Client runs on port 8080. No server needed.

## Key Files Reference

| File | Purpose |
|------|---------|
| `GameScene.js` | Main scene, initializes all systems |
| `LocalGameLoop.js` | Game loop coordinator |
| `LocalMonster.js` | Monster entity with AI |
| `LocalMonsterManager.js` | Monster spawning, respawning |
| `LocalCombatSystem.js` | All damage calculations |
| `StatsSystem.js` | Player stats, death handling |
| `FirebasePersistence.js` | Save/load to Firestore |
| `VueBridge.js` | Phaser ↔ Vue communication |
