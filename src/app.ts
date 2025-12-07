import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import scoresRoutes from "./routes/scores.routes";
import statisticsRoutes from "./routes/statistics.routes";
import topScoresRoutes from "./routes/topScores.routes";
import { errorHandler, notFound, requestLogger, rateLimiter } from "./middleware";
import CacheManager from "./utils/CacheManager";

dotenv.config();

const app: Application = express();

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(","),
}));
app.use(rateLimiter(100, 60000)); // 100 requests per minute

app.get("/", (req: Request, res: Response) => {
    res.send("G-Scores Backend is running!");
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    const cacheStatus = CacheManager.isHealthy() ? "healthy" : "disconnected";
    res.status(200).json({
        status: "ok",
        cache: cacheStatus,
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use("/api/scores", scoresRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/find-top", topScoresRoutes);

// Error handling middleware (phải đặt cuối cùng)
app.use(notFound);
app.use(errorHandler);

/**
 * Initialize cache manager on app start
 * Gọi từ server.ts
 */
export async function initializeCache(): Promise<void> {
    try {
        await CacheManager.initialize();
        console.log("[App] Cache initialized successfully");
    } catch (error) {
        console.error("[App] Cache initialization failed:", error);
    }
}

export default app;