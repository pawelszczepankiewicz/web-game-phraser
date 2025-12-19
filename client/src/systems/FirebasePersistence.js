import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { PLAYER_DEFAULT_STATS, AUTO_SAVE_INTERVAL } from "../shared/constants.js";
import { getItem } from "../shared/data/Items.js";
import { QUESTS } from "../shared/data/Quests.js";

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
   * Strip redundant data from item before saving to Firestore
   * Only keeps: instanceId, itemId, quantity
   * All other properties can be retrieved from Items.js on load
   */
  stripItemData(item) {
    if (!item) return null;
    return {
      instanceId: item.instanceId,
      itemId: item.itemId,
      quantity: item.quantity || 1,
    };
  }

  /**
   * Prepare character data for saving (strip redundant data)
   */
  prepareForSave(characterData) {
    if (!characterData) return null;

    const prepared = { ...characterData };

    // Strip redundant data from inventory items
    if (prepared.inventory) {
      // Clean backpack items
      if (prepared.inventory.backpack) {
        prepared.inventory.backpack = prepared.inventory.backpack.map((item) =>
          this.stripItemData(item)
        );
      }

      // Clean equipped items
      if (prepared.inventory.equipped) {
        const cleanedEquipped = {};
        for (const [slot, item] of Object.entries(prepared.inventory.equipped)) {
          cleanedEquipped[slot] = item ? this.stripItemData(item) : null;
        }
        prepared.inventory.equipped = cleanedEquipped;
      }
    }

    // Strip redundant data from quest objectives (keep only progress)
    if (prepared.quests) {
      if (prepared.quests.active) {
        prepared.quests.active = prepared.quests.active.map((quest) => ({
          questId: quest.questId || quest.id,
          objectives: quest.objectives?.map((obj) => ({
            type: obj.type,
            target: obj.target,
            current: obj.current || 0,
            required: obj.required,
          })),
        }));
      }
      if (prepared.quests.completed) {
        prepared.quests.completed = prepared.quests.completed.map((quest) => ({
          questId: quest.questId || quest.id,
        }));
      }
    }

    return prepared;
  }

  /**
   * Hydrate minimal item data back to full item instance
   * Retrieves full item definition from Items.js
   */
  hydrateItemData(minimalItem) {
    if (!minimalItem || !minimalItem.itemId) return null;

    const itemDef = getItem(minimalItem.itemId);
    if (!itemDef) return null;

    return {
      instanceId: minimalItem.instanceId,
      itemId: minimalItem.itemId,
      quantity: minimalItem.quantity || 1,
      ...itemDef,
    };
  }

  /**
   * Hydrate character data after loading (expand minimal data to full)
   */
  hydrateCharacterData(data) {
    if (!data) return null;

    const hydrated = { ...data };

    // Hydrate inventory items
    if (hydrated.inventory) {
      // Hydrate backpack items
      if (hydrated.inventory.backpack) {
        hydrated.inventory.backpack = hydrated.inventory.backpack
          .map((item) => this.hydrateItemData(item))
          .filter((item) => item !== null);
      }

      // Hydrate equipped items
      if (hydrated.inventory.equipped) {
        const hydratedEquipped = {};
        for (const [slot, item] of Object.entries(hydrated.inventory.equipped)) {
          hydratedEquipped[slot] = item ? this.hydrateItemData(item) : null;
        }
        hydrated.inventory.equipped = hydratedEquipped;
      }
    }

    // Hydrate quest data
    if (hydrated.quests) {
      if (hydrated.quests.active) {
        hydrated.quests.active = hydrated.quests.active
          .map((savedQuest) => {
            const questId = savedQuest.questId || savedQuest.id;
            const questDef = QUESTS[questId];
            if (!questDef) return null;

            // Merge saved progress with quest definition
            return {
              ...questDef,
              questId: questId,
              objectives: questDef.objectives.map((objDef, index) => ({
                ...objDef,
                current: savedQuest.objectives?.[index]?.current || 0,
              })),
            };
          })
          .filter((quest) => quest !== null);
      }

      if (hydrated.quests.completed) {
        hydrated.quests.completed = hydrated.quests.completed
          .map((savedQuest) => {
            const questId = savedQuest.questId || savedQuest.id;
            const questDef = QUESTS[questId];
            if (!questDef) return null;
            return { ...questDef, questId: questId };
          })
          .filter((quest) => quest !== null);
      }
    }

    return hydrated;
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
   * Hydrates minimal saved data back to full item/quest definitions
   */
  async loadCharacter(userId, email) {
    if (!userId) {
      return null;
    }

    this.userId = userId;

    try {
      const docRef = doc(db, "characters", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Hydrate minimal saved data back to full definitions
        const hydrated = this.hydrateCharacterData(data);

        // Ensure player doesn't load with 0 health (died before logout)
        if (hydrated.stats && hydrated.stats.health <= 0) {
          hydrated.stats.health = hydrated.stats.maxHealth;
        }

        return hydrated;
      } else {
        // Create new character with defaults
        const newCharacter = this.createDefaultCharacter(email);
        await this.saveCharacter(newCharacter);
        return newCharacter;
      }
    } catch (error) {
      console.error("Failed to load character:", error);
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
   * Strips redundant data before saving to minimize storage
   */
  async saveCharacter(characterData) {
    if (!this.userId) {
      return false;
    }

    try {
      // Strip redundant data before saving
      const preparedData = this.prepareForSave(characterData);

      const docRef = doc(db, "characters", this.userId);
      await setDoc(docRef, preparedData, { merge: true });
      this.lastSaveTime = Date.now();
      return true;
    } catch (error) {
      console.error("Failed to save character:", error);
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
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
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
