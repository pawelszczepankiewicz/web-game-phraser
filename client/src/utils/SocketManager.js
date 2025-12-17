import { io } from "socket.io-client";
import { auth } from "../config/firebase.js";

/**
 * SocketManager - Manages WebSocket connection to game server
 */
class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.serverUrl = "http://localhost:3001";
  }

  /**
   * Connect to game server
   */
  connect(serverUrl = this.serverUrl) {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
    this.socket.connect();

    return this.socket;
  }

  /**
   * Authenticate with Firebase token
   */
  async authenticate() {
    if (!auth.currentUser) {
      throw new Error("No user logged in");
    }

    const idToken = await auth.currentUser.getIdToken();

    return new Promise((resolve, reject) => {
      this.socket.emit("authenticate", { idToken });

      this.socket.once("auth-success", (data) => {
        this.authenticated = true;
        resolve(data);
      });

      this.socket.once("auth-failed", (data) => {
        console.error("✗ Authentication failed:", data.error);
        reject(new Error(data.error));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error("Authentication timeout"));
      }, 10000);
    });
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.socket.on("connect", () => {
      this.connected = true;
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      this.authenticated = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });

    this.socket.on("reconnect", (attemptNumber) => {});

    this.socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
    });
  }

  /**
   * Send player movement update
   */
  sendPlayerMove(x, y, velocityX, velocityY) {
    if (!this.authenticated) return;
    this.socket.emit("player-move", { x, y, velocityX, velocityY });
  }

  /**
   * Send player attack
   */
  sendPlayerAttack(targetId, targetType) {
    if (!this.authenticated) return;
    this.socket.emit("player-attack", { targetId, targetType });
  }

  /**
   * Send attack (alias for sendPlayerAttack)
   */
  sendAttack(targetId, targetType) {
    return this.sendPlayerAttack(targetId, targetType);
  }

  /**
   * Send ranged attack at position (no specific target)
   */
  sendRangedAttack(targetX, targetY) {
    if (!this.authenticated) return;
    this.socket.emit("player-ranged-attack", { targetX, targetY });
  }

  /**
   * Send inventory update
   */
  sendInventoryUpdate(inventory, stats) {
    if (!this.authenticated) return;
    this.socket.emit("inventory-update", { inventory, stats });
  }

  /**
   * Send quest update
   */
  sendQuestUpdate(quests) {
    if (!this.authenticated) return;
    this.socket.emit("quest-update", { quests });
  }

  /**
   * Send map change
   */
  sendMapChange(map, x, y) {
    if (!this.authenticated) return;
    this.socket.emit("change-map", { map, x, y });
  }

  /**
   * Send player respawn (after death)
   */
  sendRespawn(x, y) {
    if (!this.authenticated) {
      console.warn("[SocketManager] Cannot send respawn - not authenticated");
      return;
    }
    console.log("[SocketManager] Sending player-respawn:", { x, y });
    this.socket.emit("player-respawn", { x, y });
  }

  /**
   * Send loot bag item pickup request
   */
  sendLootBagPickupItem(lootBagId, instanceId) {
    if (!this.authenticated) return;
    this.socket.emit("loot-bag-pickup-item", { lootBagId, instanceId });
  }

  /**
   * Listen for events
   */
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.authenticated = false;
    }
  }

  /**
   * Check if connected and authenticated
   */
  isReady() {
    return this.connected && this.authenticated;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
