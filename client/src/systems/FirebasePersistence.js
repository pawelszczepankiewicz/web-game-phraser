import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { PLAYER_DEFAULT_STATS, AUTO_SAVE_INTERVAL } from "../../../shared/constants.js";

/**
 * FirebasePersistence - Handles direct Firestore save/load for single-player mode
 */
class FirebasePersistence {
  constructor() {
    this.userId = null;
    this.autoSaveTimer = null;
    this.lastSaveTime = 0;
    this.getCharacterData = null; // Function to get current character data
  }

  /**
   * Initialize persistence with user ID
   */
  init(userId) {
    this.userId = userId;
  }

  /**
   * Load character data from Firestore
   * Returns character data or creates new character if none exists
   */
  async loadCharacter(userId, email) {
    if (!userId) {
      console.error("[FirebasePersistence] No userId provided");
      return null;
    }

    this.userId = userId;

    try {
      const docRef = doc(db, "characters", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Ensure player doesn't load with 0 health (died before logout)
        if (data.stats && data.stats.health <= 0) {
          console.log(
            `[FirebasePersistence] Restoring health from ${data.stats.health} to ${data.stats.maxHealth}`
          );
          data.stats.health = data.stats.maxHealth;
        }

        console.log("[FirebasePersistence] Character loaded:", data.name);
        return data;
      } else {
        // Create new character with defaults
        const newCharacter = this.createDefaultCharacter(email);
        await this.saveCharacter(newCharacter);
        console.log("[FirebasePersistence] New character created:", newCharacter.name);
        return newCharacter;
      }
    } catch (error) {
      console.error("[FirebasePersistence] Failed to load character:", error);
      return null;
    }
  }

  /**
   * Create default character data for new players
   */
  createDefaultCharacter(email) {
    const name = email?.split("@")[0] || "Player";
    return {
      name,
      map: "starting_map",
      x: 500,
      y: 500,
      stats: { ...PLAYER_DEFAULT_STATS },
      inventory: {
        backpack: [],
        equipped: {
          helmet: null,
          armor: null,
          weapon: null,
          shield: null,
          amulet: null,
          ring: null,
        },
      },
      quests: {
        active: [],
        completed: [],
      },
    };
  }

  /**
   * Save character data to Firestore
   */
  async saveCharacter(characterData) {
    if (!this.userId) {
      console.error("[FirebasePersistence] No userId set for save");
      return false;
    }

    try {
      const docRef = doc(db, "characters", this.userId);
      await setDoc(docRef, characterData, { merge: true });
      this.lastSaveTime = Date.now();
      console.log("[FirebasePersistence] Character saved");
      return true;
    } catch (error) {
      console.error("[FirebasePersistence] Failed to save character:", error);
      return false;
    }
  }

  /**
   * Start auto-save timer
   * @param {Function} getDataFn - Function that returns current character data
   */
  startAutoSave(getDataFn) {
    this.getCharacterData = getDataFn;

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      if (this.getCharacterData) {
        const data = this.getCharacterData();
        if (data) {
          await this.saveCharacter(data);
        }
      }
    }, AUTO_SAVE_INTERVAL);

    console.log(`[FirebasePersistence] Auto-save started (every ${AUTO_SAVE_INTERVAL / 1000}s)`);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log("[FirebasePersistence] Auto-save stopped");
    }
  }

  /**
   * Get time since last save
   */
  getTimeSinceLastSave() {
    return Date.now() - this.lastSaveTime;
  }
}

// Export singleton instance
export const firebasePersistence = new FirebasePersistence();
