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
