import { verifyToken } from "../config/firebase.js";
import { rollMonsterLoot } from "../data/Monsters.js";

/**
 * Setup Socket.io event handlers
 */
export function setupSocketHandlers(io, playerManager, gameStateManager, lootBagManager) {
  io.on("connection", async (socket) => {
    let currentPlayer = null;

    /**
     * Player authentication
     */
    socket.on("authenticate", async (data) => {
      try {
        const { idToken } = data;

        // Verify Firebase token
        const decodedToken = await verifyToken(idToken);
        if (!decodedToken) {
          socket.emit("auth-failed", { error: "Invalid token" });
          return;
        }

        const userId = decodedToken.uid;

        // Load character data from Firestore
        let characterData = await playerManager.loadPlayer(userId);

        // If no character exists, create default character
        if (!characterData) {
          characterData = {
            name: decodedToken.email?.split("@")[0] || "Player",
            map: "starting_map",
            x: 500,
            y: 500,
            stats: {
              health: 100,
              maxHealth: 100,
              attackStrength: 10,
              armor: 5,
            },
            inventory: {
              backpack: [],
              equipped: { helmet: null, armor: null, weapon: null, shield: null },
            },
            quests: {
              active: [],
              completed: [],
            },
          };
        }

        // Add player to game
        currentPlayer = await playerManager.addPlayer(userId, characterData, socket);

        // Send authentication success
        socket.emit("auth-success", {
          userId,
          character: currentPlayer.getFullData(),
        });

        // Notify other players on the same map
        const playersOnMap = playerManager.getPlayersOnMap(currentPlayer.map);
        playersOnMap.forEach((player) => {
          if (player.userId !== userId) {
            player.socket.emit("player-joined", currentPlayer.getState());
          }
        });
      } catch (error) {
        console.error("Authentication error:", error);
        socket.emit("auth-failed", { error: "Authentication failed" });
      }
    });

    /**
     * Player movement
     */
    socket.on("player-move", (data) => {
      if (!currentPlayer) return;

      const { x, y, velocityX, velocityY } = data;
      currentPlayer.updatePosition(x, y);
      currentPlayer.updateVelocity(velocityX, velocityY);

      // Broadcast to nearby players
      const nearbyPlayers = playerManager.getPlayersInRange(
        x,
        y,
        parseInt(process.env.INTEREST_RANGE) || 500,
        currentPlayer.map
      );

      nearbyPlayers.forEach((player) => {
        if (player.userId !== currentPlayer.userId) {
          player.socket.emit("player-moved", {
            userId: currentPlayer.userId,
            x,
            y,
            velocityX,
            velocityY,
          });
        }
      });
    });

    /**
     * Player attack
     */
    socket.on("player-attack", (data) => {
      if (!currentPlayer) return;

      const { targetId, targetType } = data;

      if (targetType === "monster") {
        // Server-authoritative combat calculation
        const monster = gameStateManager.monsters.get(targetId);
        if (!monster) return;

        const damage = currentPlayer.stats.attackStrength;
        monster.health -= damage;

        // Broadcast damage to all players on map
        const playersOnMap = playerManager.getPlayersOnMap(currentPlayer.map);
        playersOnMap.forEach((player) => {
          player.socket.emit("monster-damaged", {
            monsterId: targetId,
            damage,
            health: monster.health,
            attacker: currentPlayer.userId,
          });
        });

        // Check if monster died
        if (monster.health <= 0) {
          const items = rollMonsterLoot(monster.type);

          if (items.length > 0) {
            const lootBag = lootBagManager.createLootBag(
              monster.x,
              monster.y,
              items,
              currentPlayer.map
            );

            playersOnMap.forEach((player) => {
              player.socket.emit("loot-bag-created", lootBag.getState());
            });
          }

          gameStateManager.removeMonster(targetId);
          playersOnMap.forEach((player) => {
            player.socket.emit("monster-died", {
              monsterId: targetId,
              killer: currentPlayer.userId,
            });
          });
        }
      }
    });

    /**
     * Inventory/Equipment updates
     */
    socket.on("inventory-update", async (data) => {
      if (!currentPlayer) return;

      currentPlayer.inventory = data.inventory;
      currentPlayer.stats = data.stats;

      // Save to Firestore
      await playerManager.savePlayer(currentPlayer.userId);

      // Acknowledge
      socket.emit("inventory-updated", { success: true });
    });

    /**
     * Quest updates
     */
    socket.on("quest-update", async (data) => {
      if (!currentPlayer) return;

      currentPlayer.quests = data.quests;

      // Save to Firestore
      await playerManager.savePlayer(currentPlayer.userId);

      // Acknowledge
      socket.emit("quest-updated", { success: true });
    });

    /**
     * Map change
     */
    socket.on("change-map", async (data) => {
      if (!currentPlayer) return;

      const { map, x, y } = data;

      // Notify players on old map that player left
      const oldMapPlayers = playerManager.getPlayersOnMap(currentPlayer.map);
      oldMapPlayers.forEach((player) => {
        if (player.userId !== currentPlayer.userId) {
          player.socket.emit("player-left", { userId: currentPlayer.userId });
        }
      });

      // Update player's map
      currentPlayer.map = map;
      currentPlayer.x = x;
      currentPlayer.y = y;

      // Save to Firestore
      await playerManager.savePlayer(currentPlayer.userId);

      // Notify players on new map
      const newMapPlayers = playerManager.getPlayersOnMap(map);
      newMapPlayers.forEach((player) => {
        if (player.userId !== currentPlayer.userId) {
          player.socket.emit("player-joined", currentPlayer.getState());
        }
      });

      // Acknowledge
      socket.emit("map-changed", { success: true, map });
    });

    /**
     * Loot bag item pickup
     */
    socket.on("loot-bag-pickup-item", (data) => {
      if (!currentPlayer) return;

      const { lootBagId, instanceId } = data;

      // Get the loot bag
      const lootBag = lootBagManager.getLootBag(lootBagId);
      if (!lootBag) {
        console.warn(`[Socket] Loot bag ${lootBagId} not found`);
        socket.emit("loot-bag-pickup-failed", { error: "Loot bag not found" });
        return;
      }

      // Remove the item from the loot bag
      const removedItem = lootBagManager.removeItemFromLootBag(lootBagId, instanceId);
      if (!removedItem) {
        console.warn(`[Socket] Item ${instanceId} not found in loot bag ${lootBagId}`);
        socket.emit("loot-bag-pickup-failed", { error: "Item not found" });
        return;
      }

      // Acknowledge to the requesting player
      socket.emit("loot-bag-pickup-success", {
        lootBagId,
        instanceId,
        item: removedItem,
      });

      // Broadcast item removal to all players on the map
      const playersOnMap = playerManager.getPlayersOnMap(lootBag.map);
      playersOnMap.forEach((player) => {
        player.socket.emit("loot-bag-item-removed", {
          lootBagId,
          instanceId,
        });
      });

      // If loot bag was despawned (empty), broadcast despawn
      if (!lootBagManager.getLootBag(lootBagId)) {
        playersOnMap.forEach((player) => {
          player.socket.emit("loot-bag-despawned", { lootBagId });
        });
      }
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", async () => {
      if (currentPlayer) {
        // Notify other players
        const playersOnMap = playerManager.getPlayersOnMap(currentPlayer.map);
        playersOnMap.forEach((player) => {
          if (player.userId !== currentPlayer.userId) {
            player.socket.emit("player-left", { userId: currentPlayer.userId });
          }
        });

        // Remove player
        await playerManager.removePlayer(socket.id);
      }
    });
  });
}
