# Main

This is big task, use planning mode.

Create a web based MMO RPG game that will host up to 1000 players on one server. The game and persistence layer will be hosted in Firebase, so take a note of that, but for now we will store data locally for development.

The game should be using Phaser JS framework for development.

When opening the game user should see register/login screen with the character creation - for now it will be just character name, full login/signin will be added when Firebase is connected. After creating account or logging in player will be dropped into starting location or the last position he was in before leaving game. For now the starting location will be the map already added to repository.

Development of the game will use program called Tiled for generating maps in JSON format. Game will be in isometric view and the maps will be staggerd isometric. I have added sample Tiled maps for starting zone in client/public/maps/ folder and the tiles set assets in public/assets/tilesets. The game world will consist of many Tiled maps, different sizes, but they will be loaded separately and the travel between them will be tiggerd by Tiled polygon object 'portal' (included in the sample). The maps in the future will contain not only the visual layer for the game, but also Objects that will define boundaries (collision), portals, chests, spawn points for monsters, npc's, player and any other needed data for development. But for now start only with code needed for generation of first two maps, so visuals and the boundaries (collisions both included as polygons object and in tileset items collision custom property) and the moving between maps (portal objects).

The player character will by animated based on the current action. For now I have added walking animation in public/assets/sprites/character/character_body_walk.png which is 3x3, 300x300px sprite sheet, where in each 100x100px frame the character feet are at level 0px and in the middle of the frame. The sprite sheet is walking animation where frames: 1 - standing front, 2, 3 - walking direction S and SE, 4,5,6 - walking direction E, 7 - standing to back, 8,9 - walking in direction N and NE. Corresponding frames should be flipped for walking in W direction.

The player character will have statistics, skills, inventory and quest guide. For now in statistics character will have health, attack strength and armor, but is should be easily extended in the future with other like level, experience, skill points gained after level, guild, mana, attack speed, dexterity, protection from different things, skills, etc. Skills will be added later.

The inventory should consist of backpack (max 40 slots) and currently worn gear by the character. Character should be able to wear: helmet, armor, weapon and shield. It should be easily extended in the future for other items like belts, rings and amulets. When item is clicked in backpack it should be added to character and when clicked on character is should be put into backpack. Each item will have it own stats, effects and unique IDs.

Each item in the game will have its own sprite. Items will be divided to those that when worn will be visible on character (like armor and weapons) and will have multiple sprites to match player sprite position. Sample of that you can find in public/assets/sprites/animated/equipment/equipment_helmet_leather.png. The sprites of wearable items are constructed in a same way as character sprites, so 300x300px 3x3 sprite sheet, with exactly aligned position to the current animation frame (so item should be overlaid on top of character sprite). Sprites of non-werable items for now wont be animated and added as single sprite, example of that is in public/assets/sprites/static/items/item_gold_coin.png

Quest guide should consist of current and done tasks. Quest will be either given by npc or added on other triggers like entering area, etc. For now add one sample quest for killing 3 monster and later we will connect the mechanism for doing quests.

Stats panel should be opened after hitting 'O' on keyboard. Inventory should be opened with 'I' on keyboard. And quest log with 'P'. There should be also fixed UI menu with buttons to open this panels and logout button.

Organize the code so it could be easily maintained, prioritize splitting into smaller files.

At the end create CLAUDE.md file to have context for future development. Each architecture change should be always changed in CLAUDE.md.

# Loot

Now the task is to add items and loot to the game. First each monster will have probability of dropping certain items. What items are dropped from given monster and with what probability should be defined in separate easy to maintain file. When monster is killed and some item or items are dropped, in a place where monster was killed there should appear the item_loot_bag.png from client/public/assets/sprites/static/items/item_loot_bag.png. This loot bag should disappear after 60 seconds after dropping. When loot bag is clicked there should be separate vue UI menu open with the items dropped in form of the item image. When item is clicked the item should be moved to players inventory if there is still room in it. If not appropriate message should appear.

Each item in the game will have it type and stats. Type will be: wearable - items that player can equip, and those items will be split to those that will appear on character as a separate sprite sheet (like client/public/assets/sprites/animated/equipment/armor/equipment_armor_leather.png, client/public/assets/sprites/animated/equipment/boots/equipment_boots_leather.png, client/public/assets/sprites/animated/equipment/helmet/equipment_helmet_leather.png) and those that will just add its effects (like rings, amulets, talismans). Next category will be consumable items like health potions, food. Additional category will be misc for item with no use, but can be sold. And lastly there will be gold that will be currency in the game. Gold item should be stackable by 1000 units. The items will have price, stats (like adding to armor for armor items, or attack strength for swords) and effects (like deals damage in radius 100px). The items should have separate file for management with all the necessary data needed for them (with img source).

In player inventory when item is clicked and is a wearable it should occupy the correct slot for it type. If item is both wearable and should appear as sprite on character, the sprite should appear for the character. Sprites for wearable and visible items are the same as character sprite: 300x300px, 3x3 grid with frames 1 - standing front, 2, 3 - walking direction S and SE, 4,5,6 - walking direction E, 7 - standing to back, 8,9 - walking in direction N and NE. Corresponding frames should be flipped for walking in W direction. If items are not type visible on character that should just add the effects and have static sprite like gold (client/public/assets/sprites/static/items/item_gold_coin.png). If items are consumable like health potions after right click they should be used. Both in loot bag and player inventory when item is hovered on the stats of the name and item should appear.

Now in this task do all above and add items:

- leather armor (wearable, visible on player, with effects +1 to health, non-stackable) - sprite: client/public/assets/sprites/animated/equipment/armor/equipment_armor_leather.png
- leather helmet (wearable, visible on player, with effects +1 to health, non-stackable)) - sprite: client/public/assets/sprites/animated/equipment/helmet/equipment_helmet_leather.png
- leather boots (wearable, visible on player, with effects +1 to health, non-stackable)) - sprite: client/public/assets/sprites/animated/equipment/boots/equipment_boots_leather.png
- wood shield (wearable, visible on player, with effects +1 to health, non-stackable)) - no sprite for now add fallback placeholder
- weapon wood club (wearable, visible on player, with effects attack streangh +1, non-stackable) ) - no sprite for now add fallback placeholder
- amulet (wearable, NOT visible on player, with effects attack streangh +1 and armor +1, non-stackable)) - no sprite for now add fallback placeholder
- health potion (NON-wearable - one time use, NOT visible on player, with effects restore 5 health, stackable up to 10)) - no sprite for now add fallback placeholder
- gold (NON-wearable, non-usable - used for trade, NOT visible on player, no effects, stackable up to 1000 units)) - sprite: client/public/assets/sprites/static/items/item_gold_coin.png

# NPC's - trading

The task is to add NPCs to the game. In the starting_map.json I have added two NPC spawn points: {
"height":0,
"id":11,
"name":"npc",
"point":true,
"properties":[
{
"name":"name",
"type":"string",
"value":"aibit"
},
{
"name":"trading",
"type":"bool",
"value":true
}],
"rotation":0,
"type":"",
"visible":true,
"width":0,
"x":802.666666666667,
"y":177.333333333333
},
{
"height":0,
"id":12,
"name":"npc",
"point":true,
"properties":[
{
"name":"name",
"type":"string",
"value":"sadrax"
},
{
"name":"trading",
"type":"bool",
"value":false
}],
"rotation":0,
"type":"",
"visible":true,
"width":0,
"x":290.666666666667,
"y":210.666666666667
}

For now NPC will have two roles: trader and quest giver. First lets implement the trader. 300x300px 3x3 sprites for moving animation for npc are in client/public/assets/sprites/animated/npc where after the npc\_ prefix is the npc name same as in map spawn object. NPC should spawn in the tiled maps spawn point and wander randomly in small radius (50px). When npc is clicked a popup with options should appear. For trader the options will be: Trade, Close. When 'Trade' option is clicked then the new UI vue trading panel appears where we will se our backpack contents, our gold amount and the content of traders backpack. For now trader should have all armor pices for sale. When we right click on item in our backpack it should be 'sold' and the amount of gold that item was worth should be added to our gold. The sold item is 'destroyed' in game world after sale. We can also right click on item in traders inventory to buy item for the amount of gold items is worth in stats. The items in traders inventory does not disappear.

# Quests

The task is to implement the quests mechanism in the game. For now add one quest that will be given by the SADRAX npc. When clicked on npc there will be a quests option. When quests option is clicked there will be UI panel with list of quest from this npc and the available rewards to take. For now there will be one quest. The quest will have this steps: after accepting from npc the quest we have new entry in Quests book. The quest is for killing three slime monsters. When players kills 3 slime monsters the quest updates and says that you can go to SANDRAX for reward. When clicking on Sandrax and choosing quests option the UI for quest opens and we see completed quest and in the slots with rewards there are awards: 10 gold, 5 potion_health and 1 ring_strength. When click on the reward items they are transferred to our backpack if there is available space. The slots for rewards are common for all quests.

# Cleanup

The goal of this task is to clean up redundant code, review architecture and review the code on both client and server side of this Phaser + Node game repository. Because it is an MMO game you need to keep in mind: The server is the single authority on the official game state. Core game logic (movement, combat, inventory) must run on the server for security and synchronization. Player input is sent to the server; the server validates it, updates the state, and sends the new state back to all clients. Code must be safe for many players to execute at the exact same time (e.g., two players trying to pick up the same item). Focus on: client/src and server/src and shared/data.

## License

The source code is licensed under the [MIT License](LICENSE).

Art, audio and tileset assets in `client/public/assets/` are not covered by the MIT License and remain subject to the licenses of their respective authors.
