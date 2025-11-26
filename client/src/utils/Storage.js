/**
 * LocalStorage wrapper for game data persistence
 * Designed to be easily migrated to Firebase in the future
 */
export class Storage {
  static STORAGE_KEY = "mmo_rpg_game_data";

  /**
   * Save player data
   */
  static savePlayerData(playerData) {
    try {
      const data = this.loadAllData();
      data.player = playerData;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving player data:", error);
      return false;
    }
  }

  /**
   * Load player data
   */
  static loadPlayerData() {
    try {
      const data = this.loadAllData();
      return data.player || null;
    } catch (error) {
      console.error("Error loading player data:", error);
      return null;
    }
  }

  /**
   * Save character data
   */
  static saveCharacter(characterData) {
    try {
      const data = this.loadAllData();
      data.character = characterData;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving character:", error);
      return false;
    }
  }

  /**
   * Load character data
   */
  static loadCharacter() {
    try {
      const data = this.loadAllData();
      return data.character || null;
    } catch (error) {
      console.error("Error loading character:", error);
      return null;
    }
  }

  /**
   * Load all game data
   */
  static loadAllData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error loading data:", error);
      return {};
    }
  }

  /**
   * Clear all game data
   */
  static clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing data:", error);
      return false;
    }
  }

  /**
   * Check if player is logged in
   */
  static isLoggedIn() {
    const character = this.loadCharacter();
    return character !== null && character.name;
  }
}
