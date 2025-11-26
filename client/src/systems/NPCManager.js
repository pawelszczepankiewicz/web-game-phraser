import { NPC } from "../entities/NPC.js";

/**
 * NPCManager - Handles spawning and managing NPCs
 */
export class NPCManager {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];
  }

  /**
   * Spawn NPCs from map object layer
   */
  spawnNPCsFromMap(mapManager) {
    const tilemap = mapManager.getTilemap();

    if (!mapManager || !tilemap) {
      console.warn("No map available for NPC spawning");
      return;
    }

    // Log all object layers

    // Find spawns object layer
    const objectLayer = tilemap.objects.find((layer) => layer.name === "spawns");

    if (!objectLayer || !objectLayer.objects) {
      return;
    }

    // Find NPC spawn points
    const npcSpawnPoints = objectLayer.objects.filter((obj) => obj.name === "npc");

    // Spawn each NPC
    npcSpawnPoints.forEach((spawnPoint) => {
      this.spawnNPC(spawnPoint);
    });
  }

  /**
   * Spawn a single NPC from spawn point data
   */
  spawnNPC(spawnData) {
    // Extract NPC properties
    const npcData = {
      name: this.getProperty(spawnData.properties, "name", "unnamed"),
      trading: this.getProperty(spawnData.properties, "trading", false),
      questGiver: this.getProperty(spawnData.properties, "questGiver", false),
    };

    // Create NPC at spawn point
    const npc = new NPC(this.scene, spawnData.x, spawnData.y, npcData);

    this.npcs.push(npc);
  }

  /**
   * Helper to get property from Tiled properties array
   */
  getProperty(properties, name, defaultValue) {
    if (!properties) return defaultValue;

    const prop = properties.find((p) => p.name === name);
    return prop ? prop.value : defaultValue;
  }

  /**
   * Update all NPCs
   */
  update(time, delta) {
    this.npcs.forEach((npc) => {
      if (npc.active) {
        npc.update(time, delta);
      }
    });
  }

  /**
   * Get NPC by name
   */
  getNPCByName(name) {
    return this.npcs.find((npc) => npc.npcName === name);
  }

  /**
   * Clear all NPCs
   */
  clear() {
    this.npcs.forEach((npc) => {
      if (npc.active) {
        npc.destroy();
      }
    });
    this.npcs = [];
  }
}
