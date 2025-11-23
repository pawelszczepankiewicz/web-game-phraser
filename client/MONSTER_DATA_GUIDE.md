# Monster Data Management Guide

## Overview

Monster data is now centrally managed in code (`src/data/Monsters.js`) for easier balancing and maintenance. Tiled maps only store spawn-specific properties.

## File Structure

### `src/data/Monsters.js`
Defines monster type stats (health, attack, speed, loot tables, etc.)

### Tiled Map Properties
Defines spawn-specific properties (spawn count, respawn settings, patrol behavior)

---

## Monster Type Data (in Code)

Each monster type in `Monsters.js` has these properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `name` | string | Display name | "Slime" |
| `health` | number | Maximum HP | 30 |
| `attackStrength` | number | Damage per attack | 5 |
| `attackRate` | number | Milliseconds between attacks | 2000 |
| `attackRadius` | number | Aggro range in pixels | 150 |
| `firstAttackDelay` | number | Delay before first attack (ms) | 1000 |
| `hitboxWidth` | number | Combat hitbox width | 40 |
| `hitboxHeight` | number | Combat hitbox height | 50 |
| `speed` | number | Movement speed (px/sec) | 60 |
| `lootTable` | array | Possible item drops with rates | See below |

### Loot Table Format

**Monster loot is defined in `Monsters.js` alongside monster stats:**

```javascript
lootTable: [
  {
    itemId: 'gold',
    minQuantity: 1,     // Random range
    maxQuantity: 5,
    dropRate: 1.0       // 100% chance
  },
  {
    itemId: 'health_potion',
    quantity: 1,        // Fixed quantity
    dropRate: 0.1       // 10% chance
  }
]
```

**Note**: Container loot (chests, barrels) is defined separately in `src/data/LootTables.js`

---

## Tiled Map Properties (Spawn-Specific)

When creating monster spawns in Tiled, only set these custom properties:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `monsterType` | string | ✅ Yes | - | Monster type key (e.g., "monster_slime") |
| `maxCount` | int | No | 1 | Max monsters from this spawn |
| `patrol` | bool | No | true | Whether monsters patrol the area |
| `respawn` | bool | No | true | Whether monsters respawn after death |
| `spawnRate` | int | No | 30000 | Respawn delay in milliseconds |

**Note**: The spawn object must be a **polygon** (defines the patrol/spawn area)

---

## How to Add a New Monster Type

### 1. Add to `src/data/Monsters.js`

```javascript
export const MONSTER_TYPES = {
  // Existing monsters...

  monster_goblin: {
    name: 'Goblin',
    health: 50,
    attackStrength: 8,
    attackRate: 1500,
    attackRadius: 180,
    firstAttackDelay: 800,
    hitboxWidth: 35,
    hitboxHeight: 55,
    speed: 80,
    lootTable: [
      { itemId: 'gold', minQuantity: 5, maxQuantity: 15, dropRate: 1.0 },
      { itemId: 'equipment_helmet_leather', quantity: 1, dropRate: 0.05 }
    ]
  }
};
```

### 2. Add sprite and animations to `BootScene.js`

```javascript
// Load spritesheet
this.load.spritesheet('monster_goblin', '/assets/sprites/animated/monsters/monster_goblin.png', {
  frameWidth: 100,
  frameHeight: 100
});

// Create animations in createMonsterAnimations()
const monsterTypes = ['slime', 'goblin']; // Add 'goblin'
```

### 3. Create spawn in Tiled

1. Select the **monster_spawns** object layer
2. Draw a **polygon** for the spawn/patrol area
3. Add custom properties:
   - `monsterType`: "monster_goblin"
   - `maxCount`: 3
   - `patrol`: true
   - `respawn`: true
   - `spawnRate`: 30000

That's it! All stats come from `Monsters.js` automatically.

---

## Migrating Existing Maps

### Old System (❌ Don't use)
```
Custom Properties in Tiled:
- monsterType: "monster_slime"
- maxCount: 3
- health: 30              ← Remove these
- attackStrength: 5       ← Remove these
- attackRate: 2000        ← Remove these
- attackRadius: 150       ← Remove these
- firstAttackDelay: 1000  ← Remove these
- hitboxWidth: 40         ← Remove these
- hitboxHeight: 50        ← Remove these
- patrol: true
- respawn: true
- spawnRate: 15000
```

### New System (✅ Use this)
```
Custom Properties in Tiled:
- monsterType: "monster_slime"
- maxCount: 3
- patrol: true
- respawn: true
- spawnRate: 15000
```

All the removed properties are now defined in `src/data/Monsters.js`.

---

## Benefits of New System

✅ **Centralized Balancing**: Change monster stats in one place
✅ **Consistency**: All slimes have the same stats
✅ **Less Duplication**: No need to set stats on every spawn
✅ **Easier to Add Monsters**: Just add to `Monsters.js`
✅ **Type Safety**: Monster types are validated
✅ **Loot Tables**: Managed alongside monster stats

---

## Example: Balancing Pass

**Old System**: Edit every spawn of every slime across all maps
**New System**: Edit one line in `Monsters.js`

```javascript
// Make all slimes in the game stronger
monster_slime: {
  health: 30 → 50,        // Just change here!
  attackStrength: 5 → 8,  // Affects all slime spawns
  // ...
}
```

---

## Current Monster Types

| Type | Health | Attack | Speed | Aggro Range |
|------|--------|--------|-------|-------------|
| `monster_slime` | 30 | 5 | 60 | 150px |

Add more as you create them!
