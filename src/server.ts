import app, { initializeCache } from "./app";
import dotenv from "dotenv";
import CacheManager from "./utils/CacheManager";

dotenv.config();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, async () => {
  console.log(`[Server] Running on port ${PORT}`);
  
  // Initialize Redis cache
  await initializeCache();
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received. Shutting down gracefully...");
  
  // Disconnect Redis
  await CacheManager.disconnect();
  
  // Close server
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("[Server] SIGINT received. Shutting down gracefully...");
  
  // Disconnect Redis
  await CacheManager.disconnect();
  
  // Close server
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
});