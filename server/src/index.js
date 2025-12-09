import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { initializeFirebase } from "./config/firebase.js";
import { PlayerManager } from "./managers/PlayerManager.js";
import { GameStateManager } from "./managers/GameStateManager.js";
import LootBagManager from "./managers/LootBagManager.js";
import { InventoryManager } from "./managers/InventoryManager.js";
import { QuestManager } from "./managers/QuestManager.js";
import { setupSocketHandlers } from "./handlers/socketHandlers.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:8080"];

/**
 * Initialize server
 */
async function startServer() {
  try {
    // Initialize Firebase
    await initializeFirebase();

    // Create Express app
    const app = express();
    const httpServer = createServer(app);

    // Configure CORS
    app.use(
      cors({
        origin: ALLOWED_ORIGINS,
        credentials: true,
      })
    );

    app.use(express.json());

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        players: playerManager.players.size,
        uptime: process.uptime(),
      });
    });

    // Create Socket.io server
    const io = new Server(httpServer, {
      cors: {
        origin: ALLOWED_ORIGINS,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Initialize managers
    const playerManager = new PlayerManager();
    const gameStateManager = new GameStateManager(playerManager);
    const lootBagManager = new LootBagManager();
    const inventoryManager = new InventoryManager(playerManager);
    const questManager = new QuestManager(playerManager, inventoryManager);

    // Setup socket handlers with all managers
    setupSocketHandlers(io, playerManager, gameStateManager, lootBagManager, inventoryManager, questManager);

    // Start game loop
    gameStateManager.start(io, lootBagManager);

    // Store quest manager reference in game state manager for monster death handling
    gameStateManager.questManager = questManager;

    // Start HTTP server
    httpServer.listen(PORT, () => {});

    // Graceful shutdown
    const shutdown = async (signal) => {
      // Stop game loop
      gameStateManager.stop();

      // Save all players
      await playerManager.saveAllPlayers();

      // Close server
      httpServer.close(() => {
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
