<template>
  <div v-if="gameStore.ui.inventoryVisible" class="panel inventory-panel">
    <div class="panel-header">
      <div class="header-decoration"></div>
      <h2>⚔ INVENTORY ⚔</h2>
      <button class="close-btn" @click="gameStore.toggleInventory">✕</button>
    </div>

    <div class="panel-content">
      <div class="inventory-grid">
        <!-- Equipment Section -->
        <div class="equipment-section">
          <h3>⚔ EQUIPPED</h3>

          <div class="equipment-slot" v-for="slot in equipmentSlots" :key="slot">
            <div class="slot-box" :class="{ filled: gameStore.inventory.equipped[slot] }" @click="handleEquipmentClick(slot)">
              <div class="slot-icon">{{ slotIcons[slot] }}</div>
              <span v-if="gameStore.inventory.equipped[slot]" class="item-name">
                {{ gameStore.inventory.equipped[slot].name }}
              </span>
              <span v-else class="slot-label">{{ slot.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <!-- Backpack Section -->
        <div class="backpack-section">
          <h3>🎒 BACKPACK ({{ gameStore.backpackCount }}/40)</h3>

          <div class="backpack-grid">
            <div
              v-for="i in 40"
              :key="i"
              class="backpack-slot"
              :class="{ filled: gameStore.inventory.backpack[i - 1] }"
              @click="handleBackpackClick(i - 1)"
            >
              <span v-if="gameStore.inventory.backpack[i - 1]" class="item-name">
                {{ gameStore.inventory.backpack[i - 1].name }}
                <span v-if="gameStore.inventory.backpack[i - 1].stackable" class="quantity">
                  x{{ gameStore.inventory.backpack[i - 1].quantity }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      Click items to equip/unequip | Press I to close
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

const equipmentSlots = ['helmet', 'armor', 'weapon', 'shield'];

const slotIcons = {
  helmet: '⛊',
  armor: '🛡',
  weapon: '⚔',
  shield: '🛡'
};

const handleEquipmentClick = (slot) => {
  // Emit event to Phaser to handle unequip logic
  window.dispatchEvent(new CustomEvent('unequip-item', { detail: { slot } }));
};

const handleBackpackClick = (index) => {
  const item = gameStore.inventory.backpack[index];
  if (item && item.wearable) {
    // Emit event to Phaser to handle equip logic
    window.dispatchEvent(new CustomEvent('equip-item', { detail: { instanceId: item.instanceId } }));
  }
};
</script>

<style scoped>
.inventory-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 750px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: 'Quattrocento', serif;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 215, 0, 0.3);
}

.panel-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(180deg, var(--rpg-bg-light) 0%, var(--rpg-bg-medium) 100%);
  border-bottom: 3px double var(--rpg-border-gold);
  border-radius: 4px 4px 0 0;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--rpg-gold), transparent);
}

.panel-header h2 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 215, 0, 0.5);
  letter-spacing: 2px;
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--rpg-bg-dark);
  border: 2px solid var(--rpg-bronze);
  color: var(--rpg-text-gold);
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--rpg-red);
  border-color: var(--rpg-gold);
  color: #fff;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.6);
}

.panel-content {
  padding: 25px;
}

.inventory-grid {
  display: flex;
  gap: 25px;
}

.equipment-section {
  flex: 0 0 220px;
}

.equipment-section h3,
.backpack-section h3 {
  color: var(--rpg-text-gold);
  font-family: 'Cinzel', serif;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--rpg-bronze);
}

.equipment-slot {
  margin-bottom: 12px;
}

.slot-box {
  position: relative;
  width: 100%;
  min-height: 70px;
  background: rgba(0, 0, 0, 0.4);
  border: 3px solid var(--rpg-bronze);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  text-align: center;
  padding: 10px;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.slot-box:hover {
  border-color: var(--rpg-gold);
  background: rgba(0, 0, 0, 0.6);
  transform: translateY(-2px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.3);
}

.slot-box.filled {
  border-color: var(--rpg-gold-dark);
  background: rgba(50, 30, 10, 0.5);
}

.slot-box.filled:hover {
  border-color: var(--rpg-gold);
}

.slot-icon {
  font-size: 24px;
  margin-bottom: 5px;
  opacity: 0.6;
}

.slot-box.filled .slot-icon {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
}

.slot-label {
  color: var(--rpg-bronze);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.item-name {
  color: var(--rpg-text-light);
  font-weight: bold;
  font-size: 12px;
  word-break: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.backpack-section {
  flex: 1;
}

.backpack-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.backpack-slot {
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid var(--rpg-bronze);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 9px;
  text-align: center;
  padding: 3px;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
}

.backpack-slot:hover {
  border-color: var(--rpg-gold);
  background: rgba(0, 0, 0, 0.6);
  transform: scale(1.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(212, 175, 55, 0.3);
  z-index: 1;
}

.backpack-slot.filled {
  border-color: var(--rpg-gold-dark);
  background: rgba(50, 30, 10, 0.5);
}

.backpack-slot.filled:hover {
  border-color: var(--rpg-gold);
}

.backpack-slot .item-name {
  font-size: 9px;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.quantity {
  color: var(--rpg-text-gold);
  font-weight: bold;
  font-size: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.panel-footer {
  padding: 15px 20px;
  text-align: center;
  color: var(--rpg-gold-dark);
  font-size: 13px;
  border-top: 3px double var(--rpg-border-gold);
  background: var(--rpg-bg-dark);
  border-radius: 0 0 4px 4px;
  font-style: italic;
}
</style>
