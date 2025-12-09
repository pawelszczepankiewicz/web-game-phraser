# CLAUDE.md - AI Development Guide

This document provides comprehensive information for AI assistants working on this Phaser + Node.js MMO game.

## Project Overview

A 2D isometric MMO game built with:
- **Client**: Phaser 3 + Vue 3 + Pinia (Vite bundled)
- **Server**: Node.js + Express + Socket.io
- **Database**: Firebase Firestore
- **Maps**: Tiled JSON format (staggered isometric)

## Critical Architecture Principle

> **The server is the single source of truth.**

All game logic that affects state (combat, inventory, quests, loot) MUST be validated by the server. The client sends *intents*, the server validates and broadcasts *results*.

```
CLIENT                          SERVER
  │                               │
  │  "I want to attack X"         │
  ├──────────────────────────────►│
  │                               │ Validates range, calculates damage
  │  "Attack hit for 15 damage"   │
  │◄──────────────────────────────┤
  │                               │
```

## Directory Structure

```
game-web-phaser/
├── client/                      # Phaser 3 frontend
│   ├── src/
│   │   ├── main.js              # Phaser initialization
│   │   ├── scenes/
│   │   │   ├── BootScene.js     # Asset loading, auth
│   │   │   └── GameScene.js     # Main gameplay (~990 lines)
│   │   ├── entities/
│   │   │   ├── Player.js        # Local player
│   │   │   ├── RemotePlayer.js  # Other players (multiplayer)
│   │   │   ├── RemoteMonster.js # Server-controlled monsters
│   │   │   ├── Monster.js       # [DEPRECATED] Old client-side monsters
│   │   │   ├── NPC.js           # NPCs
│   │   │   └── LootBag.js       # Loot bags
│   │   ├── systems/
│   │   │   ├── MapManager.js    # Tiled map loading
│   │   │   ├── MonsterManager.js # Renders server monsters
│   │   │   ├── InventorySystem.js
│   │   │   ├── StatsSystem.js
│   │   │   ├── QuestSystem.js
│   │   │   ├── CollisionManager.js
│   │   │   ├── LootBagManager.js
│   │   │   └── NPCManager.js
│   │   ├── utils/
│   │   │   ├── SocketManager.js # WebSocket client
│   │   │   ├── VueBridge.js     # Phaser ↔ Vue communication
│   │   │   └── TileUtils.js
│   │   └── vue/
│   │       ├── app.js           # Vue + Pinia setup
│   │       └── stores/gameStore.js
│   └── public/
│       ├── maps/                # Tiled JSON maps
│       └── assets/              # Sprites, tilesets
│
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── index.js             # Server entry point
│   │   ├── config/firebase.js   # Firebase Admin SDK
│   │   ├── handlers/
│   │   │   └── socketHandlers.js # All socket event handlers
│   │   ├── managers/
│   │   │   ├── PlayerManager.js  # Player tracking, persistence
│   │   │   ├── GameStateManager.js # Game loop, state broadcast
│   │   │   ├── MonsterManager.js # Monster spawning, AI
│   │   │   ├── LootBagManager.js
│   │   │   ├── InventoryManager.js # Validated inventory ops
│   │   │   └── QuestManager.js   # Validated quest ops
│   │   ├── models/
│   │   │   ├── Player.js        # Server player model
│   │   │   ├── Monster.js       # Server monster model
│   │   │   └── LootBag.js
│   │   └── utils/
│   │       └── MapDataLoader.js # Parses Tiled JSON
│
└── shared/                      # Shared between client & server
    ├── constants.js             # Game constants
    ├── utils/
    │   ├── geometry.js          # Distance, point-in-polygon
    │   ├── random.js            # ID generation, random helpers
    │   └── index.js
    └── data/
        ├── Monsters.js          # Monster definitions, loot tables
        ├── Items.js             # All items (~1000 lines)
        ├── Quests.js            # Quest definitions
        ├── Traders.js           # NPC shop inventories
        └── LootTables.js
```

## Server-Side Systems

### Game Loop (GameStateManager)

Runs at 60 ticks/second:
```javascript
tick() {
  // 1. Update monster AI
  const attacks = this.monsterManager.update(deltaTime);

  // 2. Process monster attacks on players
  this.processMonsterAttacks(attacks);

  // 3. Check loot bag despawns
  this.checkLootBagDespawns();

  // 4. Broadcast state to clients (interest-filtered)
  this.broadcastStateUpdates();
}
```

### Monster System

Monsters are spawned and controlled entirely by the server:

1. **MapDataLoader** reads Tiled JSON spawn objects
2. **MonsterManager** spawns monsters at random points in spawn polygons
3. **Monster model** runs AI each tick (patrol, chase, attack)
4. State is broadcast to clients within INTEREST_RANGE (500px)

### Combat Flow

```
1. Client clicks monster → sends "player-attack" { targetId, targetType }
2. Server validates:
   - Monster exists and is active
   - Player is on same map
   - Player is within ATTACK_RANGE (100px)
3. Server calculates damage from player.stats.attackStrength
4. Server applies damage to monster
5. Server broadcasts "monster-damaged" to all players on map
6. If monster dies:
   - Server rolls loot using shared/data/Monsters.js
   - Server creates loot bag
   - Server updates quest progress for killer
   - Server broadcasts "monster-died" and "loot-bag-created"
```

### Inventory Validation

The server validates all inventory operations:

| Event | Validation |
|-------|------------|
| `equip-item` | Item exists in backpack, is wearable, slot is valid |
| `unequip-item` | Item is equipped, backpack has space |
| `use-item` | Item exists, has effects (consumable) |
| `loot-bag-pickup-item` | Player in range, item exists in bag |

### Quest Validation

Server tracks kills per player:
```javascript
// On monster death
questManager.recordKill(killerId, monsterType);
questManager.onMonsterKilled(player, monsterType);
// → Updates quest objectives, moves complete quests
```

## Socket Events Reference

### Authentication
| Event | Direction | Data |
|-------|-----------|------|
| `authenticate` | C→S | `{ idToken }` |
| `auth-success` | S→C | `{ userId, character }` |
| `auth-failed` | S→C | `{ error }` |

### Movement
| Event | Direction | Data |
|-------|-----------|------|
| `player-move` | C→S | `{ x, y, velocityX, velocityY }` |
| `player-moved` | S→C | `{ userId, x, y, velocityX, velocityY }` |

### Combat
| Event | Direction | Data |
|-------|-----------|------|
| `player-attack` | C→S | `{ targetId, targetType }` |
| `attack-result` | S→C | `{ success, reason, damage, killed }` |
| `monster-damaged` | S→C | `{ monsterId, damage, health, maxHealth }` |
| `monster-died` | S→C | `{ monsterId, monsterType, killerId, x, y }` |
| `player-damaged` | S→C | `{ damage, health, maxHealth, attackerId }` |
| `player-died` | S→C | `{ killerId, killerType }` |

### State Sync
| Event | Direction | Data |
|-------|-----------|------|
| `state-update` | S→C | `{ players: [], monsters: [] }` |

### Inventory
| Event | Direction | Data |
|-------|-----------|------|
| `equip-item` | C→S | `{ instanceId }` |
| `equip-success` | S→C | `{ slot, item, inventory, stats }` |
| `unequip-item` | C→S | `{ slot }` |
| `use-item` | C→S | `{ instanceId }` |
| `inventory-update` | C→S | `{ inventory, stats }` (legacy) |

### Quests
| Event | Direction | Data |
|-------|-----------|------|
| `accept-quest` | C→S | `{ questId }` |
| `quest-accepted` | S→C | `{ quest, quests }` |
| `claim-quest-rewards` | C→S | `{ questId }` |
| `quest-rewards-claimed` | S→C | `{ rewards, inventory, quests }` |
| `quest-progress` | S→C | `{ monsterType, updatedQuests, quests }` |

### Loot
| Event | Direction | Data |
|-------|-----------|------|
| `loot-bag-created` | S→C | `{ id, x, y, items, map }` |
| `loot-bag-pickup-item` | C→S | `{ lootBagId, instanceId }` |
| `loot-bag-pickup-success` | S→C | `{ lootBagId, instanceId, item }` |
| `loot-bag-item-removed` | S→C | `{ lootBagId, instanceId }` |
| `loot-bag-despawned` | S→C | `{ lootBagId }` |

### Map
| Event | Direction | Data |
|-------|-----------|------|
| `change-map` | C→S | `{ map, x, y }` |
| `map-changed` | S→C | `{ success, map }` |

## Data Schemas

### Player (Server Model)
```javascript
{
  userId: string,
  socketId: string,
  name: string,
  map: string,
  x: number,
  y: number,
  stats: {
    health: number,
    maxHealth: number,
    attackStrength: number,
    armor: number
  },
  inventory: {
    backpack: [ItemInstance, ...],
    equipped: {
      helmet: ItemInstance | null,
      armor: ItemInstance | null,
      weapon: ItemInstance | null,
      shield: ItemInstance | null
    }
  },
  quests: {
    active: [QuestInstance, ...],
    completed: [QuestInstance, ...]
  }
}
```

### Monster State (Broadcast)
```javascript
{
  id: string,
  monsterType: string,
  x: number,
  y: number,
  health: number,
  maxHealth: number,
  velocityX: number,
  velocityY: number,
  currentDirection: "n" | "s" | "e" | "w",
  state: "idle" | "patrolling" | "chasing" | "attacking",
  active: boolean
}
```

### Item Instance
```javascript
{
  instanceId: string,      // Unique per item
  itemId: string,          // References Items.js
  quantity: number,
  // ...spread from item definition
}
```

## Adding New Features

### New Monster Type

1. Add to `shared/data/Monsters.js`:
```javascript
export const MONSTER_TYPES = {
  monster_newtype: {
    name: "New Monster",
    health: 100,
    attackStrength: 15,
    attackRate: 1500,
    attackRadius: 200,
    firstAttackDelay: 500,
    hitboxWidth: 30,
    hitboxHeight: 40,
    speed: 80,
    lootTable: [
      { itemId: "gold", minQuantity: 5, maxQuantity: 15, dropRate: 1.0 },
      { itemId: "some_item", quantity: 1, dropRate: 0.1 }
    ]
  }
};
```

2. Add sprite assets to `client/public/assets/sprites/`
3. Add spawn objects in Tiled map with `monsterType: "monster_newtype"`

### New Item

Add to `shared/data/Items.js`:
```javascript
export const ITEMS = {
  new_item_id: {
    id: "new_item_id",
    name: "New Item",
    type: "equipment",      // or "consumable"
    category: "weapon",     // weapon, armor, helmet, potion, etc.
    slot: "weapon",         // for equipment
    stats: {                // for equipment
      attackStrength: 10
    },
    effects: {              // for consumables
      heal: 50
    },
    wearable: true,
    visible: true,
    stackable: false,
    price: 100,
    description: "A new item"
  }
};
```

### New Quest

Add to `shared/data/Quests.js`:
```javascript
export const QUESTS = {
  new_quest_id: {
    id: "new_quest_id",
    name: "New Quest",
    description: "Kill 5 slimes",
    giver: "npc_name",      // NPC who gives this quest
    objectives: [
      { type: "kill", target: "monster_slime", required: 5, description: "Kill slimes" }
    ],
    rewards: {
      gold: 50,
      items: [{ itemId: "some_item", quantity: 1 }]
    }
  }
};
```

### New Socket Event

1. Add handler in `server/src/handlers/socketHandlers.js`:
```javascript
socket.on("new-event", async (data) => {
  if (!currentPlayer) return;

  // Validate
  // Process
  // Respond
  socket.emit("new-event-response", { success: true });
});
```

2. Add client-side handler in `client/src/scenes/GameScene.js`:
```javascript
socketManager.on("new-event-response", (data) => {
  // Handle response
});
```

3. Add send method to `client/src/utils/SocketManager.js`:
```javascript
sendNewEvent(data) {
  this.socket.emit("new-event", data);
}
```

## Constants Reference

From `shared/constants.js`:

| Constant | Value | Description |
|----------|-------|-------------|
| `ATTACK_RANGE` | 100 | Pixels for melee attacks |
| `INTEREST_RANGE` | 500 | State broadcast range |
| `LOOT_BAG_DESPAWN_TIME` | 60000 | 60 seconds |
| `LOOT_PICKUP_RANGE` | 100 | Must be within to pickup |
| `MAX_BACKPACK_SLOTS` | 40 | Inventory limit |
| `GOLD_MAX_STACK` | 1000 | Max gold per stack |
| `SERVER_TICK_RATE` | 60 | Updates per second |
| `TELEPORT_THRESHOLD` | 200 | Suspicious if exceeded |

## Common Patterns

### Client Sends Intent, Server Validates
```javascript
// Client
socketManager.sendAttack(monsterId, "monster");

// Server validates and broadcasts result
socket.emit("attack-result", { success, damage, killed });
```

### Server Broadcasts to Map
```javascript
const playersOnMap = playerManager.getPlayersOnMap(mapKey);
playersOnMap.forEach(player => {
  player.socket.emit("event-name", data);
});
```

### Interest-Based Filtering
```javascript
const nearbyPlayers = playerManager.getPlayersInRange(x, y, INTEREST_RANGE, map);
const nearbyMonsters = monsterManager.getMonstersInRange(x, y, INTEREST_RANGE, map);
```

## Running the Project

```bash
# Terminal 1 - Server
cd server
npm install
npm run dev

# Terminal 2 - Client
cd client
npm install
npm run dev
```

Server runs on port 3000, client on port 8080.

## Security Checklist for New Features

- [ ] Does the server validate all inputs?
- [ ] Is the server the source of truth for this state?
- [ ] Can a malicious client gain an advantage by modifying values?
- [ ] Is the feature safe for concurrent players? (race conditions)
- [ ] Are range/proximity checks enforced server-side?
- [ ] Is there rate limiting if needed?

## Known Limitations / TODOs

1. **Legacy inventory-update** - Still accepts full inventory from client for backwards compatibility. Should be fully migrated to validated operations.

2. **Position validation** - Currently only logs suspicious movement, doesn't reject. Could be stricter.

3. **Quest validation** - Kill counts are tracked but quest-update still accepts client state. Should require accept-quest flow.

4. **No PvP** - Combat only supports player vs monster.

5. **No instance dungeons** - All players share the same world.
