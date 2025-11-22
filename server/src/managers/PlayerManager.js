import { Player } from '../models/Player.js';
import { getFirestore } from '../config/firebase.js';

/**
 * PlayerManager - Manages all connected players
 */
export class PlayerManager {
  constructor() {
    this.players = new Map(); // userId -> Player
    this.socketToUser = new Map(); // socketId -> userId
    this.db = getFirestore();
  }

  /**
   * Add a player
   */
  async addPlayer(userId, characterData, socket) {
    const player = new Player(userId, characterData, socket);
    this.players.set(userId, player);
    this.socketToUser.set(socket.id, userId);

    console.log(`Player joined: ${player.name} (${userId}) - Total players: ${this.players.size}`);
    return player;
  }

  /**
   * Remove a player
   */
  async removePlayer(socketId) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;

    const player = this.players.get(userId);
    if (!player) return null;

    // Save player data to Firestore before removing
    await this.savePlayer(userId);

    this.players.delete(userId);
    this.socketToUser.delete(socketId);

    console.log(`Player left: ${player.name} (${userId}) - Total players: ${this.players.size}`);
    return player;
  }

  /**
   * Get player by userId
   */
  getPlayer(userId) {
    return this.players.get(userId);
  }

  /**
   * Get player by socketId
   */
  getPlayerBySocket(socketId) {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.players.get(userId) : null;
  }

  /**
   * Get all players
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get players on a specific map
   */
  getPlayersOnMap(mapKey) {
    return this.getAllPlayers().filter(p => p.map === mapKey);
  }

  /**
   * Get players within range (for interest management)
   */
  getPlayersInRange(x, y, range, mapKey) {
    return this.getPlayersOnMap(mapKey).filter(player => {
      const dx = player.x - x;
      const dy = player.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= range;
    });
  }

  /**
   * Load player data from Firestore
   */
  async loadPlayer(userId) {
    try {
      const doc = await this.db.collection('characters').doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data();
    } catch (error) {
      console.error(`Failed to load player ${userId}:`, error);
      return null;
    }
  }

  /**
   * Save player data to Firestore
   */
  async savePlayer(userId) {
    const player = this.players.get(userId);
    if (!player) return false;

    try {
      await this.db.collection('characters').doc(userId).set(
        player.getFullData(),
        { merge: true }
      );
      return true;
    } catch (error) {
      console.error(`Failed to save player ${userId}:`, error);
      return false;
    }
  }

  /**
   * Save all players (for graceful shutdown)
   */
  async saveAllPlayers() {
    console.log('Saving all players...');
    const promises = Array.from(this.players.keys()).map(userId =>
      this.savePlayer(userId)
    );
    await Promise.all(promises);
    console.log('All players saved');
  }
}
