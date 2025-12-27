import { getItem } from "./Items.js";

/**
 * Trader inventory definitions
 * Each trader has a fixed inventory that doesn't deplete
 */

import { ITEMS } from "./Items.js";

const getAllItemsForTrader = () => {
  let allItemsForTrader = [];

  for (const itemId in ITEMS) {
    const item = ITEMS[itemId];
    allItemsForTrader.push({ itemId: itemId, quantity: 1 });
  }

  return allItemsForTrader;
};

export const TRADER_INVENTORIES = {
  aibit: [
    // All armor pieces
    { itemId: "armor_leather", quantity: 1 },
    { itemId: "helmet_leather", quantity: 1 },
    { itemId: "boots_leather", quantity: 1 },
    { itemId: "shield_wood", quantity: 1 },
    { itemId: "weapon_wood_club", quantity: 1 },
    // Accessories
    { itemId: "amulet_basic", quantity: 1 },
    { itemId: "ring_strength", quantity: 1 },
    { itemId: "ring_defense", quantity: 1 },
    // Consumables
    { itemId: "potion_health", quantity: 10 },
  ],
  // aibit: getAllItemsForTrader(),

  sadrax: [
    // Could have different items for a non-trader NPC
    // For now, empty since sadrax is not a trader
  ],
};

/**
 * Get trader inventory by trader name
 * Returns array of item instances (not depleting, always shows same items)
 */
export function getTraderInventory(traderName) {
  const inventoryData = TRADER_INVENTORIES[traderName];

  if (!inventoryData) {
    return [];
  }

  // Create item instances from inventory data
  const inventory = inventoryData
    .map((entry) => {
      const itemDef = getItem(entry.itemId);
      if (!itemDef) {
        return null;
      }

      return {
        instanceId: `trader_${traderName}_${entry.itemId}`, // Fixed ID for trader items
        itemId: entry.itemId,
        quantity: entry.quantity,
        ...itemDef,
      };
    })
    .filter((item) => item !== null);

  return inventory;
}
