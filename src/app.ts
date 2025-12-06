import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors from "cors";

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(","),
}));

app.get("/", (req: Request, res: Response) => {
    res.send("G-Scores Backend is running!");
});

export default app;