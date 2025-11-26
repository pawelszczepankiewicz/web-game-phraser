import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useGameStore } from "./stores/gameStore";

// Create Pinia instance
const pinia = createPinia();

// Create Vue app
const app = createApp(App);

// Use Pinia for state management
app.use(pinia);

// Mount the app
app.mount("#vue-root");

// Expose game store globally for Phaser bridge
window.__GAME_STORE__ = useGameStore();
