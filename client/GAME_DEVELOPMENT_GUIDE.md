# Game Development Guide

Complete step-by-step instructions for adding content to the game.

---

## Table of Contents

1. [Adding New Maps](#adding-new-maps)
2. [Adding Map Layers](#adding-map-layers)
3. [Setting Up Collisions](#setting-up-collisions)
4. [Creating Portals](#creating-portals)
5. [Adding Spawn Points](#adding-spawn-points)
6. [Adding Animated Environmental Sprites](#adding-animated-environmental-sprites)
7. [Adding New Tilesets](#adding-new-tilesets)
8. [Adding New Items](#adding-new-items)
9. [Adding New Quests](#adding-new-quests)
10. [Adding New NPCs](#adding-new-npcs)
11. [Adding New Monsters](#adding-new-monsters)

---

## Adding New Maps

### Step 1: Create Map in Tiled

1. **Open Tiled Map Editor**
2. **File → New → New Map**
3. **Configure Map Settings:**
   ```
   Orientation: Isometric (Staggered)
   Tile layer format: CSV
   Tile render order: Right Down
   Map size: 100x100 tiles (or desired size)
   Tile size: 64x64 pixels
   ```
4. **Click OK**

### Step 2: Save Map

1. **File → Save As**
2. **Location:** `/client/public/maps/your_map_name.json`
3. **Format:** JSON map files (*.json, *.tmj)

### Step 3: Register Map in BootScene

**File:** `/client/src/scenes/BootScene.js`

Add to the map loading section:
```javascript
// Load maps
this.load.tilemapTiledJSON("starting_map", "/maps/starting_map.json");
this.load.tilemapTiledJSON("second_map", "/maps/second_map.json");
this.load.tilemapTiledJSON("third_map", "/maps/third_map.json");
this.load.tilemapTiledJSON("your_map_name", "/maps/your_map_name.json"); // ADD THIS
```

### Step 4: Set Default Map (Optional)

**File:** `/server/src/models/Player.js`

Change the default spawn map:
```javascript
this.map = playerData.map || 'your_map_name'; // Change default map here
```

---

## Adding Map Layers

Maps should have these standard layers (in order from bottom to top):

### 1. Ground Layer (depth: 0)

**Purpose:** Base terrain (grass, dirt, stone)

**In Tiled:**
1. **Layer → New → Tile Layer**
2. **Name:** `ground` (exact name)
3. **Paint tiles** for the base terrain

**Auto-configured:** MapManager sets depth to 0

### 2. Props Layer (depth: 1)

**Purpose:** Environmental objects (trees, rocks, fences)

**In Tiled:**
1. **Layer → New → Tile Layer**
2. **Name:** `props` (exact name)
3. **Paint tiles** for props

**Features:**
- Objects with collision property become dynamic sprites
- Auto-depth sorting (render in front/behind player based on position)

### 3. Buildings Layer (depth: 101)

**Purpose:** Structures (houses, walls, roofs)

**In Tiled:**
1. **Layer → New → Tile Layer**
2. **Name:** `buildings` (exact name)
3. **Paint tiles** for buildings

**Auto-configured:** MapManager sets depth to 101 (always in front of player)

### Layer Naming Rules

- Names must be **exact** (`ground`, `props`, `buildings`)
- Order doesn't matter (depth is set by name)
- Can have additional layers, but these 3 are standard

---

## Setting Up Collisions

There are **two types** of collisions:

### Type 1: Tile-Based Collisions

**Use for:** Regular ground tiles, water, lava

**In Tiled:**
1. **Select a tile** in the tileset
2. **Right-click → Tile Properties**
3. **Add Custom Property:**
   - Name: `collision`
   - Type: `bool`
   - Value: `true`
4. **Click OK**

**Effect:** Any tile with this ID will block movement

### Type 2: Polygon Collisions

**Use for:** Complex shapes, buildings, irregular objects

**In Tiled:**
1. **Create Object Layer** named `collisions` (exact name)
2. **Select Polygon Tool** (toolbar)
3. **Draw polygon** around collision area
4. **No properties needed** - all polygons in "collisions" layer block movement

**Tips:**
- Use polygons for complex shapes
- Keep polygons simple (fewer points = better performance)
- Can have multiple polygons on one layer

### Making Props Collidable

**For tiles in the `props` layer:**

1. **In Tileset:** Set tile property `collision: true`
2. **System automatically:**
   - Hides the tile (alpha 0)
   - Creates a sprite at that position
   - Sprite handles depth sorting
   - Collision is checked via tile properties

---

## Creating Portals

**Purpose:** Transition between maps

### Step 1: Create Portal Object Layer

**In Tiled:**
1. **Layer → New → Object Layer**
2. **Name:** `portal` (exact name)

### Step 2: Add Portal Objects

1. **Select Rectangle Tool**
2. **Draw rectangle** where portal should trigger
3. **In Object Properties:**
   - **Name:** `portal_to_mapname` (descriptive)
   - **Add Custom Property:**
     - Name: `targetMap`
     - Type: `string`
     - Value: `second_map` (map key from BootScene)

### Step 3: Set Spawn Point in Target Map

**In the target map**, add a spawn point:

1. **Create Object Layer** named `spawns`
2. **Add Point Object** at desired arrival location
3. **Object Properties:**
   - **Name:** `player`
   - **Type:** `player`
   - **Add Custom Properties:**
     - Name: `fromMap`
     - Type: `string`
     - Value: `starting_map` (the map you're coming FROM)

### Portal Example

**starting_map.json:**
```
Portal Object:
├─ Rectangle at (500, 600) size 64x64
├─ Name: "portal_to_second_map"
└─ Property: targetMap = "second_map"
```

**second_map.json:**
```
Spawn Point:
├─ Point at (100, 100)
├─ Name: "player"
├─ Type: "player"
└─ Property: fromMap = "starting_map"
```

### Default Spawn Point

Every map should have one default spawn:
```
Spawn Point:
├─ Point at (500, 500)
├─ Name: "player"
├─ Type: "player"
└─ Property: default = true
```

---

## Adding Spawn Points

### Player Spawn Points

**Purpose:** Where player appears when entering map

**Setup:**
1. **Create Object Layer:** `spawns`
2. **Add Point Object**
3. **Properties:**
   - Name: `player`
   - Type: `player`
   - Custom Properties:
     - `default` (bool): `true` - Default spawn
     - `fromMap` (string): `starting_map` - Spawn from specific map

**System automatically:**
- Uses `fromMap` spawn if coming from that map
- Falls back to `default` spawn
- Falls back to first spawn point
- Falls back to (500, 500) if no spawns exist

### Monster Spawn Areas

**Purpose:** Define areas where monsters spawn

**Setup:**
1. **Create Object Layer:** `spawns`
2. **Select Polygon Tool**
3. **Draw polygon** around spawn area
4. **Object Properties:**
   - Name: `monster`
   - Custom Properties:
     - `monsterType` (string): `slime`
     - `maxMonsters` (int): `3`
     - `respawnTime` (int): `5000` (milliseconds)

**Example:**
```
Monster Spawn:
├─ Polygon defining forest area
├─ Name: "monster"
└─ Properties:
   ├─ monsterType: "slime"
   ├─ maxMonsters: 3
   └─ respawnTime: 5000
```

---

## Adding Animated Environmental Sprites

**Purpose:** Campfires, portals, torches, waterfalls, etc.

### Step 1: Prepare Sprite

**Requirements:**
- Horizontal spritesheet (all frames in one row)
- Example: 6 frames of 36×48 = 216×48 total

**Location:** `/client/public/assets/sprites/animated/items/`

### Step 2: Load Sprite in BootScene

**File:** `/client/src/scenes/BootScene.js`

Add spritesheet loading:
```javascript
this.load.spritesheet(
  "campfire",
  "/assets/sprites/animated/items/campfire.png",
  {
    frameWidth: 36,  // Width of ONE frame
    frameHeight: 48, // Height of ONE frame
  }
);
```

**To calculate frame size:**
- frameWidth = totalWidth / numberOfFrames
- Example: 216 / 6 = 36

### Step 3: Add Object in Tiled

1. **Create Object Layer:** `animations` (exact name)
2. **Add Point Object** at desired location
3. **Object Properties:**
   - **Required:**
     - Name: `spriteKey`
     - Type: `string`
     - Value: `campfire` (matches spritesheet key)

   - **Optional:**
     - `depth` (int): `150` - Render depth (default: 150)
     - `scale` (float): `1.0` - Size multiplier (default: 1.0)
     - `startFrame` (int): `0` - First frame to play (default: 0)
     - `endFrame` (int): `-1` - Last frame (-1 = all frames)
     - `frameRate` (int): `8` - Animation speed in FPS (default: 8)

### Examples

**Basic Campfire:**
```
Object Properties:
└─ spriteKey: "campfire"
(uses defaults: all frames at 8 FPS)
```

**Custom Animation:**
```
Object Properties:
├─ spriteKey: "campfire"
├─ startFrame: 2
├─ endFrame: 5
├─ frameRate: 12
├─ scale: 2.0
└─ depth: 200
```

**System automatically:**
- Creates unique animation per sprite instance
- Plays animation on loop
- Handles cleanup on map change

---

## Adding New Tilesets

### Step 1: Add Tileset Image

**Location:** `/client/public/assets/tilesets/your_tileset.png`

**Requirements:**
- Dimensions must be multiples of tile size
- For 64×64 tiles: width and height must be divisible by 64
- Example: 704×704 (11×11 tiles) ✅
- Example: 960×288 (15×4.5 tiles) ❌

### Step 2: Load in BootScene

**File:** `/client/src/scenes/BootScene.js`

Add two entries:

```javascript
// 1. Load as image for tilemap
this.load.image(
  "your_tileset",
  "/assets/tilesets/your_tileset.png"
);

// 2. Load as spritesheet for dynamic props
this.load.spritesheet(
  "your_tileset_sheet",
  "/assets/tilesets/your_tileset.png",
  {
    frameWidth: 64,
    frameHeight: 64
  }
);
```

**Important:**
- Image key and spritesheet key must match tileset name in Tiled
- Spritesheet key must have `_sheet` suffix

### Step 3: Use in Tiled

1. **Map → Add External Tileset** or **New Tileset**
2. **Configure:**
   - Name: `your_tileset` (must match BootScene key)
   - Image: `../assets/tilesets/your_tileset.png`
   - Tile width: 64
   - Tile height: 64
3. **Use tiles** in your map layers

**System automatically:**
- Detects tileset from map JSON
- Loads both image and spritesheet versions
- Handles prop sprite creation

---

## Adding New Items

### Step 1: Create Item Definition

**File:** `/client/src/data/Items.js`

Add new item to the object:

```javascript
export const ITEMS = {
  // Existing items...

  // New item
  magic_sword: {
    id: 'magic_sword',
    name: 'Magic Sword',
    description: 'A sword imbued with magical power',
    type: 'equipment',
    category: 'weapon',

    // Sprite configuration
    icon: '/assets/sprites/static/equipment/weapon/magic_sword.png',
    animatedSprite: null, // Not animated
    staticWearableSprite: '/assets/sprites/static/equipment/weapon/magic_sword.png',

    // Item properties
    wearable: true,
    visible: true,
    slot: 'weapon',
    stackable: false,

    // Stats
    stats: {
      attackStrength: 25,
      maxHealth: 10
    },

    // Economy
    price: 1000,
    sellPrice: 500
  }
};
```

### Item Types

**Equipment (wearable):**
```javascript
{
  type: 'equipment',
  category: 'weapon' | 'armor' | 'helmet' | 'boots' | 'shield',
  wearable: true,
  slot: 'weapon' | 'armor' | 'helmet' | 'boots' | 'shield',
  stats: { attackStrength: 10, armor: 5 }
}
```

**Consumable:**
```javascript
{
  type: 'consumable',
  wearable: false,
  stackable: true,
  maxStack: 20,
  effects: [
    { type: 'heal', value: 50 }
  ]
}
```

**Currency:**
```javascript
{
  type: 'currency',
  stackable: true,
  maxStack: 1000,
  wearable: false
}
```

### Step 2: Add Item Sprite

**For UI (icon):**
- **Location:** `/client/public/assets/sprites/static/equipment/[category]/`
- **Format:** PNG, any size (will be scaled)

**For animated equipment (helmet, armor, boots):**
- **Location:** `/client/public/assets/sprites/animated/equipment/[category]/`
- **Format:** 300×300 spritesheet (3×3 grid, 100×100 frames)
- **Frames:** 9 frames (stand_s, walk_s×2, walk_e×3, stand_n, walk_n×2)

**For static wearables (weapon, shield):**
- **Location:** `/client/public/assets/sprites/static/equipment/[category]/`
- **Format:** PNG, positioned for side display

### Step 3: Load Sprites in BootScene (if new)

**For animated equipment:**
```javascript
this.load.spritesheet(
  "equipment_magic_helmet",
  "/assets/sprites/animated/equipment/helmet/equipment_magic_helmet.png",
  {
    frameWidth: 100,
    frameHeight: 100,
  }
);
```

Then add to animation creation:
```javascript
createEquipmentAnimations() {
  const equipmentTypes = [
    "equipment_helmet_leather",
    "equipment_magic_helmet", // ADD THIS
  ];
  // ... rest of method
}
```

### Step 4: Use Item

**In code:**
```javascript
// Add to inventory
scene.inventorySystem.addItem('magic_sword');

// Create loot drop
const lootBag = new LootBag(scene, x, y, [
  createItemInstance('magic_sword', 1)
]);
```

**As quest reward:**
```javascript
rewards: {
  items: ['magic_sword']
}
```

---

## Adding New Quests

### Step 1: Create Quest Definition

**File:** `/client/src/data/Quests.js`

```javascript
export const QUESTS = {
  // Existing quests...

  slay_dragon: {
    id: 'slay_dragon',
    name: 'Dragon Slayer',
    description: 'Defeat the ancient dragon terrorizing the village',
    giver: 'sadrax', // NPC who gives quest

    objectives: [
      {
        type: 'kill',
        target: 'dragon',
        required: 1,
        description: 'Slay the dragon'
      }
    ],

    rewards: {
      gold: 5000,
      items: ['dragon_sword', 'dragon_scale']
    }
  }
};
```

### Quest Objective Types

**Kill Objective:**
```javascript
{
  type: 'kill',
  target: 'monster_slime',
  required: 10,
  description: 'Kill 10 slimes'
}
```

**Collect Objective:**
```javascript
{
  type: 'collect',
  target: 'dragon_scale',
  required: 5,
  description: 'Collect 5 dragon scales'
}
```

**Talk Objective:**
```javascript
{
  type: 'talk',
  target: 'npc_merchant',
  required: 1,
  description: 'Speak with the merchant'
}
```

### Step 2: Quest Flow

**Starting:**
```javascript
scene.questSystem.startQuest('slay_dragon');
```

**Updating Progress:**
```javascript
// When monster is killed
scene.questSystem.updateQuestProgress('slay_dragon', 0, 1);
// Parameters: questId, objectiveIndex, amount
```

**Checking Completion:**
```javascript
if (scene.questSystem.isQuestComplete('slay_dragon')) {
  scene.questSystem.completeQuest('slay_dragon');
}
```

**Claiming Rewards:**
- Handled via NPCQuestPanel UI
- Player clicks reward items
- Gold/items added to inventory

### Step 3: NPC Integration

**NPCs automatically:**
- Show available quests from their assigned quests
- Show active quests given by them
- Show completed quests ready for reward

**Quest assignment by NPC name:**
```javascript
giver: 'sadrax' // Must match NPC name in lowercase
```

---

## Adding New NPCs

### Step 1: Create NPC Sprite

**Location:** `/client/public/assets/sprites/animated/npc/`

**Format:**
- 300×300 spritesheet (3×3 grid)
- 100×100 per frame
- Frames: stand_s, walk_s×2, walk_e×3, stand_n, walk_n×2

**Naming:** `npc_yourname.png`

### Step 2: Load NPC Sprite

**File:** `/client/src/scenes/BootScene.js`

```javascript
this.load.spritesheet(
  "npc_merchant",
  "/assets/sprites/animated/npc/npc_merchant.png",
  {
    frameWidth: 100,
    frameHeight: 100,
  }
);
```

### Step 3: Create NPC Animations

**Same file, in `createNPCAnimations()`:**

```javascript
createNPCAnimations() {
  const npcTypes = [
    'aibit',
    'sadrax',
    'merchant' // ADD THIS
  ];
  // ... method creates all animations automatically
}
```

### Step 4: Add NPC Data

**File:** `/client/src/data/NPCs.js`

```javascript
export const NPCS = {
  merchant: {
    id: 'merchant',
    name: 'Merchant',
    spriteKey: 'npc_merchant',
    dialogues: {
      greeting: "Welcome to my shop! Would you like to trade?",
      farewell: "Come back soon!"
    },
    shopInventory: [
      { itemId: 'health_potion', price: 50 },
      { itemId: 'magic_sword', price: 1000 }
    ]
  }
};
```

### Step 5: Spawn NPC in GameScene

**File:** `/client/src/scenes/GameScene.js`

In the `create()` method:

```javascript
// Create NPCs
this.npcs = [];

const merchantNPC = new NPC(
  this,
  500,  // x position
  600,  // y position
  'npc_merchant',
  'merchant' // NPC data key
);
this.npcs.push(merchantNPC);
```

**NPC features:**
- Auto-interaction when player nearby
- Quest dialogue
- Trading system
- Persistent across sessions

---

## Adding New Monsters

### Step 1: Create Monster Sprite

**Location:** `/client/public/assets/sprites/animated/monsters/`

**Format:**
- 300×300 spritesheet (3×3 grid)
- 100×100 per frame
- Frames: stand_s, walk_s×2, walk_e×3, stand_n, walk_n×2

**Naming:** `monster_yourname.png`

### Step 2: Load Monster Sprite

**File:** `/client/src/scenes/BootScene.js`

```javascript
this.load.spritesheet(
  "monster_goblin",
  "/assets/sprites/animated/monsters/monster_goblin.png",
  {
    frameWidth: 100,
    frameHeight: 100,
  }
);
```

### Step 3: Create Monster Animations

**Same file, in `createMonsterAnimations()`:**

```javascript
createMonsterAnimations() {
  const monsterTypes = [
    'slime',
    'goblin' // ADD THIS
  ];
  // ... method creates all animations automatically
}
```

### Step 4: Define Monster Stats

**File:** `/client/src/data/Monsters.js` (create if doesn't exist)

```javascript
export const MONSTERS = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    spriteKey: 'monster_goblin',
    stats: {
      health: 50,
      maxHealth: 50,
      attackStrength: 15,
      armor: 5,
      speed: 80
    },
    loot: [
      { itemId: 'gold', quantity: 10, chance: 1.0 },
      { itemId: 'rusty_sword', quantity: 1, chance: 0.2 }
    ],
    xp: 25
  }
};
```

### Step 5: Create Spawn Areas in Tiled

1. **Map:** `spawns` object layer
2. **Tool:** Polygon
3. **Object:**
   - Name: `monster`
   - Properties:
     - `monsterType`: `goblin`
     - `maxMonsters`: `5`
     - `respawnTime`: `10000`

### Step 6: Spawn Monsters in GameScene

**File:** `/client/src/scenes/GameScene.js`

```javascript
// Get spawn areas from map
const spawnAreas = this.mapManager.getSpawnObjects();

spawnAreas.forEach(area => {
  if (area.properties.monsterType === 'goblin') {
    // Create monster spawner
    this.monsterSpawner.addSpawnArea(area);
  }
});
```

---

## Common Patterns

### Map Travel Flow

```
1. Player enters portal rectangle
2. Portal checks targetMap property
3. GameScene saves current game state
4. GameScene calls loadMap(targetMap, fromMap)
5. MapManager unloads current map (cleans up sprites)
6. MapManager loads new map
7. GameScene gets spawn point (fromMap match or default)
8. Player positioned at spawn point
9. All systems refreshed (collision, portals, etc.)
```

### Item Lifecycle

```
1. Item defined in Items.js
2. Item sprite loaded in BootScene
3. Item instance created with createItemInstance()
4. Item added to inventory/loot
5. Item displayed in UI (uses icon property)
6. Item equipped (uses animatedSprite or staticWearableSprite)
7. Stats applied to player
```

### Quest Lifecycle

```
1. Quest defined in Quests.js
2. NPC assigned as giver
3. Player talks to NPC → sees available quests
4. Player accepts quest → added to activeQuests
5. Objectives tracked (kills, collections, etc.)
6. Quest completed → moved to completedQuests
7. Player claims rewards → items/gold added
8. Quest marked as rewarded → removed from UI
```

---

## Best Practices

### Maps
- ✅ Always have a default spawn point
- ✅ Test portals in both directions
- ✅ Use consistent tile size (64×64)
- ✅ Name layers exactly: ground, props, buildings
- ✅ Keep polygon collisions simple

### Sprites
- ✅ Match sprite dimensions in BootScene to actual file
- ✅ Use power-of-2 dimensions when possible
- ✅ Keep spritesheets organized by type
- ✅ Name sprites descriptively

### Items
- ✅ Set appropriate price and sellPrice
- ✅ Balance stats carefully
- ✅ Test stackable items at max stack
- ✅ Provide clear descriptions

### Quests
- ✅ Write clear objective descriptions
- ✅ Test completion conditions
- ✅ Balance rewards with difficulty
- ✅ Ensure NPCs exist for givers

### NPCs
- ✅ Position away from collision areas
- ✅ Write engaging dialogue
- ✅ Balance shop prices
- ✅ Test interaction range

### Monsters
- ✅ Balance health/damage with player progression
- ✅ Set reasonable loot drop chances
- ✅ Test respawn timing
- ✅ Vary monsters per area

---

## Troubleshooting

### Map doesn't load
- Check map is added to BootScene
- Verify JSON syntax is valid
- Check console for errors

### Tiles show all frames side-by-side
- frameWidth/frameHeight wrong in BootScene
- Check actual sprite dimensions

### Collision doesn't work
- Check tile property: `collision: true`
- Verify layer name is exact
- Check polygon is in "collisions" layer

### Portal doesn't trigger
- Check layer name is "portal"
- Verify targetMap exists in BootScene
- Check spawn point exists in target map

### Animation doesn't play
- Check spriteKey matches BootScene
- Verify layer name is "animations"
- Check sprite has multiple frames

### Item doesn't appear
- Check item ID is correct
- Verify sprite path is correct
- Check BootScene if new sprite

---

## Quick Reference

### Layer Names (Exact)
- `ground` - Base terrain
- `props` - Environmental objects
- `buildings` - Structures
- `collisions` - Collision polygons
- `portal` - Map portals
- `spawns` - Player/monster spawns
- `animations` - Environmental animations

### Object Property Names
- `targetMap` - Portal destination
- `fromMap` - Spawn point source
- `default` - Default spawn flag
- `spriteKey` - Animation sprite
- `collision` - Tile collision flag
- `monsterType` - Monster spawn type
- `maxMonsters` - Spawn limit
- `respawnTime` - Respawn delay

### File Locations
- Maps: `/client/public/maps/`
- Tilesets: `/client/public/assets/tilesets/`
- Items: `/client/public/assets/sprites/static/items/`
- Equipment: `/client/public/assets/sprites/static|animated/equipment/`
- NPCs: `/client/public/assets/sprites/animated/npc/`
- Monsters: `/client/public/assets/sprites/animated/monsters/`
- Environment: `/client/public/assets/sprites/animated/items/`

---

**Last Updated:** 2025-01-23
