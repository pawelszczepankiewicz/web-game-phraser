# MMO RPG Game - Architecture Documentation

## Overview

This is a web-based MMO RPG game built with Phaser JS framework, designed to support up to 1000 players per server. The game features isometric graphics, character progression, inventory management, quest systems, and multi-map exploration.

## Technology Stack

- **Game Engine**: Phaser 3.80.1
- **Build Tool**: Vite 5.0.0
- **Map Editor**: Tiled (JSON format)
- **Current Persistence**: LocalStorage (for development)
- **Future Persistence**: Firebase (planned)

## Project Structure

```
client/
├── src/
│   ├── main.js                 # Entry point, Phaser configuration
│   ├── scenes/                 # Game scenes
│   │   ├── BootScene.js       # Asset loading scene
│   │   ├── LoginScene.js      # Character creation/login
│   │   └── GameScene.js       # Main game scene
│   ├── entities/              # Game entities
│   │   └── Player.js          # Player character with animations
│   ├── systems/               # Game systems
│   │   ├── MapManager.js      # Tiled map loading and management
│   │   ├── CollisionManager.js # Collision detection
│   │   ├── StatsSystem.js     # Character statistics
│   │   ├── InventorySystem.js # Inventory and equipment
│   │   └── QuestSystem.js     # Quest management
│   ├── ui/                    # UI components
│   │   ├── StatsPanel.js      # Character stats panel (O key)
│   │   ├── InventoryPanel.js  # Inventory panel (I key)
│   │   ├── QuestPanel.js      # Quest log panel (P key)
│   │   └── UIMenu.js          # Fixed bottom menu
│   ├── data/                  # Game data definitions
│   │   ├── Items.js           # Item definitions
│   │   └── Quests.js          # Quest definitions
│   └── utils/                 # Utility functions
│       └── Storage.js         # LocalStorage wrapper
├── public/
│   ├── index.html
│   ├── maps/                  # Tiled JSON maps
│   │   ├── starting_map.json
│   │   └── second_map.json
│   └── assets/
│       ├── tilesets/          # Map tilesets
│       └── sprites/
│           ├── animated/      # Animated sprites (character, equipment)
│           └── static/        # Static sprites (items)
├── package.json
└── vite.config.js
```

## Core Systems

### 1. Scene Management

#### BootScene
- Loads all game assets (maps, tilesets, sprites)
- Creates character animations
- Checks login status and routes to appropriate scene

#### LoginScene
- Character creation interface
- Name-based authentication (Firebase integration pending)
- Creates initial character data with default stats

#### GameScene
- Main gameplay scene
- Coordinates all game systems
- Handles player movement, collisions, and map transitions
- Manages UI panels and keyboard shortcuts
- Auto-saves every 30 seconds

### 2. Map System (MapManager)

**Key Features:**
- Loads Tiled JSON maps (staggered isometric format)
- Supports multiple layers (ground, props, objects)
- Extracts collision objects (polygons)
- Extracts portal objects for map transitions
- Handles tileset collision properties

**Map Structure:**
- **Ground Layer**: Base terrain tiles
- **Props Layer**: Decorative objects (trees, rocks, etc.)
- **Collisions Layer**: Polygon objects for boundaries
- **Portal Layer**: Rectangle objects with targetMap property

**Extensibility:**
- Can add more layers (decorations, effects, etc.)
- Can add more object types (spawn points, NPCs, chests, etc.)

### 3. Collision System (CollisionManager)

**Features:**
- Polygon-based collision detection (from Tiled objects)
- Tile-based collision detection (from tileset properties)
- Ray casting algorithm for point-in-polygon checks
- Debug visualization support

**How it Works:**
1. Extracts collision polygons from map
2. Extracts tiles with collision=true property
3. Checks player position against all collision bodies
4. Reverts player position if collision detected

### 4. Player System

**Player Entity:**
- Animated sprite with 8-directional movement
- Equipment sprite layering system
- Collision body smaller than sprite for better feel

**Animation Frames (3x3 spritesheet, 100x100px per frame):**
- Frame 0: Standing front (S)
- Frames 1-2: Walking S/SE
- Frames 3-5: Walking E (flipped for W)
- Frame 6: Standing back (N)
- Frames 7-8: Walking N/NE

**Movement:**
- Arrow keys for 8-directional movement
- Velocity: 150 pixels/second
- Diagonal movement normalized

### 5. Stats System (StatsSystem)

**Current Stats:**
- health / maxHealth
- attackStrength
- armor

**Extensible For:**
- level, experience
- mana / maxMana
- attackSpeed
- dexterity
- elemental resistances (fire, ice, etc.)
- guild affiliation
- skill points

**Features:**
- Stat change listeners
- Damage calculation with armor reduction
- Health regeneration support (for future)

### 6. Inventory System (InventorySystem)

**Structure:**
- **Backpack**: 40 slots for items
- **Equipment Slots**: helmet, armor, weapon, shield

**Extensible Equipment Slots:**
- belt
- ring1, ring2
- amulet
- boots
- gloves

**Features:**
- Equip/unequip items by clicking
- Automatic stat application when equipping
- Stackable item support
- Item instance system with unique IDs

**Item Types:**
- **Wearable Items**: Have animated spritesheets, render on character
- **Non-wearable Items**: Static sprites, stored in backpack only

### 7. Quest System (QuestSystem)

**Structure:**
- Active quests
- Completed quests

**Quest Features:**
- Multiple objectives per quest
- Progress tracking
- Automatic completion detection
- Reward system (experience, gold, items)

**Current Sample Quest:**
- "Monster Hunter": Kill 3 monsters

**Extensible For:**
- NPC-given quests
- Area trigger quests
- Collection quests
- Escort quests
- Puzzle quests

### 8. UI System

**StatsPanel (O key):**
- Character name
- Current/max health
- Attack strength
- Armor

**InventoryPanel (I key):**
- Equipment slots (left side)
- Backpack grid (right side, 8x5)
- Click to equip/unequip

**QuestPanel (P key):**
- Active quests with progress
- Completed quests list

**UIMenu (Fixed Bottom Bar):**
- Stats button
- Inventory button
- Quests button
- Logout button

## Data Persistence

### Current: LocalStorage
- Key: `mmo_rpg_game_data`
- Stores: character data, stats, inventory, quests, position, current map

### Future: Firebase
The Storage utility is designed to be easily migrated to Firebase:
- Replace LocalStorage calls with Firebase Realtime Database calls
- Update save/load methods to use async/await
- Add authentication integration
- Implement real-time sync

## Map Format (Tiled)

### Tileset Properties
Each tile can have custom properties:
- `collision` (bool): Whether the tile blocks movement

### Object Layers

**Collisions Layer:**
- Type: objectgroup
- Contains: Polygon objects
- Properties: collision=true

**Portal Layer:**
- Type: objectgroup
- Contains: Rectangle objects
- Properties: targetMap (string) - name of destination map

**Future Object Types:**
- Spawn points: player_spawn, monster_spawn, npc_spawn
- Interactive objects: chest, door, lever
- NPCs: npc with dialogue property
- Triggers: area_trigger for events

## Character Data Structure

```javascript
{
  name: "CharacterName",
  map: "starting_map",
  x: 500,
  y: 500,
  stats: {
    health: 100,
    maxHealth: 100,
    attackStrength: 10,
    armor: 5
  },
  inventory: {
    backpack: [
      {
        instanceId: "item_xxx",
        itemId: "helmet_leather",
        quantity: 1,
        // ... item properties
      }
    ],
    equipped: {
      helmet: null,
      armor: null,
      weapon: null,
      shield: null
    }
  },
  quests: {
    active: [
      {
        instanceId: "quest_xxx",
        id: "kill_3_monsters",
        objectives: [...]
      }
    ],
    completed: [...]
  }
}
```

## Item Data Structure

```javascript
{
  id: "helmet_leather",
  name: "Leather Helmet",
  type: "armor",
  slot: "helmet",
  stats: { armor: 2 },
  effects: [],
  sprite: "helmet_leather",
  wearable: true,
  animated: true,
  stackable: false,
  description: "A basic leather helmet"
}
```

## Quest Data Structure

```javascript
{
  id: "kill_3_monsters",
  name: "Monster Hunter",
  description: "Defeat 3 monsters to prove your worth",
  objectives: [
    {
      type: "kill",
      target: "monster",
      current: 0,
      required: 3,
      description: "Defeat monsters"
    }
  ],
  rewards: {
    experience: 100,
    gold: 50,
    items: ["item_gold_coin"]
  }
}
```

## Running the Game

### Development
```bash
cd client
npm install
npm run dev
```
Game runs at http://localhost:3000

### Production Build
```bash
npm run build
npm run preview
```

## Adding New Content

### Adding a New Map
1. Create map in Tiled with same tileset and structure
2. Export as JSON to `public/maps/`
3. Load in BootScene: `this.load.tilemapTiledJSON('map_key', '/maps/map_file.json')`
4. Add portal objects in Tiled with targetMap property

### Adding a New Item
1. Add sprite to `public/assets/sprites/`
2. Load in BootScene if needed
3. Add definition to `src/data/Items.js`
4. Item automatically available in inventory system

### Adding a New Quest
1. Add definition to `src/data/Quests.js`
2. Quest can be started via `questSystem.startQuest('quest_id')`
3. Update progress via `questSystem.updateQuestProgress('quest_id', objectiveIndex, amount)`

### Adding a New Stat
1. Add to default stats in StatsSystem constructor
2. Add UI element in StatsPanel
3. Stat automatically saved/loaded

### Adding a New Equipment Slot
1. Add to equipped object in InventorySystem constructor
2. Add UI slot in InventoryPanel.createEquipmentSection
3. Add sprite layer in Player.equipmentSprites

## Known Limitations / Future Enhancements

### Current Phase
- Single-player only (no multiplayer yet)
- No monsters to fight (quest system ready but no enemies)
- Limited item sprites (only helmet_leather and gold_coin)
- No NPC system
- No combat system
- No experience/leveling system

### Planned Enhancements
1. **Multiplayer Support**
   - Firebase integration for real-time sync
   - Player synchronization
   - Server-side validation

2. **Combat System**
   - Monster entities
   - Attack animations
   - Damage numbers
   - Loot drops

3. **NPC System**
   - NPC entities
   - Dialogue system
   - Quest givers
   - Merchants

4. **Character Progression**
   - Experience system
   - Level up rewards
   - Skill trees
   - Attribute points

5. **Social Features**
   - Guilds
   - Friends list
   - Chat system
   - Trading

6. **Additional Content**
   - More maps
   - More items
   - More quests
   - Boss encounters

## Debugging

### Enable Collision Debug View
In GameScene.create(), add:
```javascript
this.debugGraphics = this.add.graphics();
this.collisionManager.debugDraw(this.debugGraphics);
```

### Enable Physics Debug
In main.js config:
```javascript
physics: {
  default: 'arcade',
  arcade: {
    debug: true  // Shows collision bodies
  }
}
```

### Console Logging
Systems log important events to console:
- Map loading
- Quest start/complete
- Item equip/unequip
- Auto-save events

## Performance Considerations

### Current Optimizations
- Object pooling for UI elements
- Efficient collision detection with bounds checking
- Camera following for viewport culling
- Auto-save throttling (30 seconds)

### For 1000 Players (Future)
- Server-side rendering for other players
- Network interpolation
- Area-of-interest culling
- Optimized network protocol
- Firebase hosting and scaling
- CDN for static assets

## Architecture Updates

**IMPORTANT**: When making architecture changes, always update this CLAUDE.md file with:
- New systems or components
- Modified data structures
- New file locations
- Changed workflows
- Breaking changes

This ensures continuity across development sessions.
