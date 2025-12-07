import { Router } from "express";
import ScoresController from "../controllers/searchScores.controller";
import { validateSbd } from "../middleware";

const router = Router();
const scoresController = new ScoresController();

// Route tìm kiếm điểm theo số báo danh
router.get("/search/:sbd", validateSbd, scoresController.searchScores);

export default router;