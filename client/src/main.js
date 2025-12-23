import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { GameScene } from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#2d2d2d",
  scene: [BootScene, GameScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true, // Enable crisp pixel rendering for all textures
  },
};

// Don't start game immediately - wait for authentication
let game = null;

// Listen for start-game event from Vue
window.addEventListener("start-game", (event) => {
  // Only create game once
  if (!game) {
    game = new Phaser.Game(config);

    // Store character data for BootScene to access
    window.GAME_CHARACTER_DATA = event.detail.characterData;
    window.GAME_USER_ID = event.detail.userId;
  }
});
