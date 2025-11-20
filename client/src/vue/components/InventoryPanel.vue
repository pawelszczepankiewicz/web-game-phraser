<template>
  <div v-if="gameStore.ui.inventoryVisible" class="panel inventory-panel">
    <div class="panel-header">
      <h2>INVENTORY</h2>
      <button class="close-btn" @click="gameStore.toggleInventory">✕</button>
    </div>

    <div class="panel-content">
      <div class="inventory-grid">
        <!-- Equipment Section -->
        <div class="equipment-section">
          <h3>EQUIPPED</h3>

          <div class="equipment-slot" v-for="slot in equipmentSlots" :key="slot">
            <div class="slot-box" @click="handleEquipmentClick(slot)">
              <span v-if="gameStore.inventory.equipped[slot]" class="item-name">
                {{ gameStore.inventory.equipped[slot].name }}
              </span>
              <span v-else class="slot-label">{{ slot.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <!-- Backpack Section -->
        <div class="backpack-section">
          <h3>BACKPACK ({{ gameStore.backpackCount }}/40)</h3>

          <div class="backpack-grid">
            <div
              v-for="i in 40"
              :key="i"
              class="backpack-slot"
              @click="handleBackpackClick(i - 1)"
            >
              <span v-if="gameStore.inventory.backpack[i - 1]" class="item-name">
                {{ gameStore.inventory.backpack[i - 1].name }}
                <span v-if="gameStore.inventory.backpack[i - 1].stackable">
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
  width: 700px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #fff;
  color: #fff;
  font-family: Arial, sans-serif;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #fff;
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.close-btn:hover {
  color: #ff4444;
}

.panel-content {
  padding: 20px;
}

.inventory-grid {
  display: flex;
  gap: 20px;
}

.equipment-section {
  flex: 0 0 200px;
}

.equipment-section h3,
.backpack-section h3 {
  color: #ffff00;
  font-size: 16px;
  margin: 0 0 10px 0;
}

.equipment-slot {
  margin-bottom: 10px;
}

.slot-box {
  width: 100%;
  height: 60px;
  background: #333;
  border: 2px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  padding: 5px;
}

.slot-box:hover {
  border-color: #fff;
  background: #444;
}

.slot-label {
  color: #888;
}

.backpack-section {
  flex: 1;
}

.backpack-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
}

.backpack-slot {
  width: 50px;
  height: 50px;
  background: #333;
  border: 2px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  text-align: center;
  padding: 2px;
}

.backpack-slot:hover {
  border-color: #fff;
  background: #444;
}

.item-name {
  font-size: 10px;
  word-break: break-word;
}

.panel-footer {
  padding: 10px 20px;
  text-align: center;
  color: #888;
  font-size: 12px;
  border-top: 2px solid #444;
}
</style>
