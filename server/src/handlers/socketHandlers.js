import { verifyToken } from "../config/firebase.js";
import { ATTACK_RANGE, LOOT_PICKUP_RANGE, TELEPORT_THRESHOLD, INTEREST_RANGE } from "../../../shared/constants.js";
import { isInRange, distance } from "../../../shared/utils/geometry.js";

/**
 * Setup Socket.io event handlers
 */
export function setupSocketHandlers(io, playerManager, gameStateManager, lootBagManager, inventoryManager, questManager) {
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
     * Player movement - with validation
     */
    socket.on("player-move", (data) => {
      if (!currentPlayer) return;

      const { x, y, velocityX, velocityY } = data;

      // Validate position delta (basic speed hack detection)
      const dist = distance(currentPlayer.x, currentPlayer.y, x, y);
      if (dist > TELEPORT_THRESHOLD) {
        console.warn(
          `[Position] Suspicious movement from ${currentPlayer.name}: ${dist.toFixed(0)}px`
        );
        // For now just log, don't reject (could be lag or map transition)
        // In production, could reject or flag for review
      }

      currentPlayer.updatePosition(x, y);
      currentPlayer.updateVelocity(velocityX, velocityY);

      // Broadcast to nearby players
      const nearbyPlayers = playerManager.getPlayersInRange(
        x,
        y,
        INTEREST_RANGE,
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
     * Player attack - Server-authoritative combat
     */
    socket.on("player-attack", (data) => {
      if (!currentPlayer) return;

      const { targetId, targetType } = data;

      if (targetType === "monster") {
        // Use GameStateManager for server-authoritative combat
        const result = gameStateManager.handlePlayerAttack(currentPlayer, targetId);

        // Send result back to the attacking player
        socket.emit("attack-result", {
          success: result.success,
          reason: result.reason,
          damage: result.damage,
          killed: result.killed,
        });
      }
    });

    /**
     * Inventory/Equipment updates - Legacy handler for backwards compatibility
     * Note: Prefer specific operations (equip-item, use-item, etc.) for validation
     */
    socket.on("inventory-update", async (data) => {
      if (!currentPlayer) return;

      // TODO: In production, remove this and require all changes through validated operations
      // For now, accept but log a warning
      console.log(`[Inventory] Legacy update from ${currentPlayer.name} - consider using specific operations`);

      currentPlayer.inventory = data.inventory;
      currentPlayer.stats = data.stats;

      // Save to Firestore
      await playerManager.savePlayer(currentPlayer.userId);

      // Acknowledge
      socket.emit("inventory-updated", { success: true });
    });

    /**
     * Equip item - Server validated
     */
    socket.on("equip-item", async (data) => {
      if (!currentPlayer) return;

      const { instanceId } = data;
      const result = inventoryManager.equipItem(currentPlayer, instanceId);

      if (result.success) {
        await playerManager.savePlayer(currentPlayer.userId);
        socket.emit("equip-success", {
          slot: result.slot,
          item: result.item,
          inventory: currentPlayer.inventory,
          stats: currentPlayer.stats,
        });
      } else {
        socket.emit("equip-failed", { reason: result.reason });
      }
    });

    /**
     * Unequip item - Server validated
     */
    socket.on("unequip-item", async (data) => {
      if (!currentPlayer) return;

      const { slot } = data;
      const result = inventoryManager.unequipItem(currentPlayer, slot);

      if (result.success) {
        await playerManager.savePlayer(currentPlayer.userId);
        socket.emit("unequip-success", {
          item: result.item,
          inventory: currentPlayer.inventory,
          stats: currentPlayer.stats,
        });
      } else {
        socket.emit("unequip-failed", { reason: result.reason });
      }
    });

    /**
     * Use item - Server validated
     */
    socket.on("use-item", async (data) => {
      if (!currentPlayer) return;

      const { instanceId } = data;
      const result = inventoryManager.useItem(currentPlayer, instanceId);

      if (result.success) {
        await playerManager.savePlayer(currentPlayer.userId);
        socket.emit("use-item-success", {
          effects: result.effects,
          inventory: currentPlayer.inventory,
          stats: currentPlayer.stats,
        });
      } else {
        socket.emit("use-item-failed", { reason: result.reason });
      }
    });

    /**
     * Quest updates - Legacy handler (prefer specific operations)
     */
    socket.on("quest-update", async (data) => {
      if (!currentPlayer) return;

      // For backwards compatibility, accept quest updates
      // TODO: Fully migrate to validated operations
      currentPlayer.quests = data.quests;

      // Save to Firestore
      await playerManager.savePlayer(currentPlayer.userId);

      // Acknowledge
      socket.emit("quest-updated", { success: true });
    });

    /**
     * Accept quest - Server validated
     */
    socket.on("accept-quest", async (data) => {
      if (!currentPlayer) return;

      const { questId } = data;
      const result = questManager.acceptQuest(currentPlayer, questId);

      if (result.success) {
        await playerManager.savePlayer(currentPlayer.userId);
        socket.emit("quest-accepted", {
          quest: result.quest,
          quests: currentPlayer.quests,
        });
      } else {
        socket.emit("quest-accept-failed", { reason: result.reason });
      }
    });

    /**
     * Claim quest rewards - Server validated
     */
    socket.on("claim-quest-rewards", async (data) => {
      if (!currentPlayer) return;

      const { questId } = data;
      const result = questManager.claimRewards(currentPlayer, questId);

      if (result.success) {
        await playerManager.savePlayer(currentPlayer.userId);
        socket.emit("quest-rewards-claimed", {
          rewards: result.rewards,
          inventory: currentPlayer.inventory,
          quests: currentPlayer.quests,
        });
      } else {
        socket.emit("quest-rewards-failed", { reason: result.reason });
      }
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
     * Loot bag item pickup - with range validation
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

      // Validate player is on same map
      if (lootBag.map !== currentPlayer.map) {
        socket.emit("loot-bag-pickup-failed", { error: "Wrong map" });
        return;
      }

      // Validate player is in range
      if (!isInRange(currentPlayer.x, currentPlayer.y, lootBag.x, lootBag.y, LOOT_PICKUP_RANGE)) {
        socket.emit("loot-bag-pickup-failed", { error: "Too far away" });
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
