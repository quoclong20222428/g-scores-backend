import { Router } from "express";
import ScoresController from "../controllers/searchScores.controller";
import { validateSbd } from "../middleware";

const router = Router();
const scoresController = new ScoresController();

// Route tìm kiếm điểm theo số báo danh
router.get("/search/:sbd", validateSbd, scoresController.searchScores);

// Route lấy tất cả điểm (có phân trang)
router.get("/", scoresController.getAll);

// Route tìm kiếm nâng cao theo điều kiện
router.get("/advanced", scoresController.searchByConditions);

export default router;