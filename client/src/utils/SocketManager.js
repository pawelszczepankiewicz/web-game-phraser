/**
 * SocketManager - STUB for single-player mode
 * Provides no-op implementations of socket methods
 */
class SocketManager {
  constructor() {
    this.connected = false;
    this.authenticated = false;
  }

  connect() {
    // No-op in single-player
    return null;
  }

  async authenticate() {
    // No-op in single-player
    return null;
  }

  sendPlayerMove() {}
  sendPlayerAttack() {}
  sendAttack() {}
  sendRangedAttack() {}
  sendInventoryUpdate() {}
  sendQuestUpdate() {}
  sendMapChange() {}
  sendRespawn() {}
  sendLootBagPickupItem() {}

  on() {}
  off() {}
  disconnect() {}

  /**
   * Always returns false in single-player mode
   */
  isReady() {
    return false;
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
