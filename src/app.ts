import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import scoresRoutes from "./routes/scores.routes";
import statisticsRoutes from "./routes/statistics.routes";
import { errorHandler, notFound, requestLogger, rateLimiter } from "./middleware";

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

// Routes
app.use("/api/scores", scoresRoutes);
app.use("/api/statistics", statisticsRoutes);

// Error handling middleware (phải đặt cuối cùng)
app.use(notFound);
app.use(errorHandler);

export default app;