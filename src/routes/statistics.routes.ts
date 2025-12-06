import { Router } from "express";
import StatisticsController from "../controllers/statistics.controller";

const router = Router();
const statisticsController = new StatisticsController();

// Route lấy thống kê tất cả các môn học
router.get("/subjects", statisticsController.getAllSubjects);

// Route lấy thống kê một môn học cụ thể
router.get("/subjects/:subject", statisticsController.getSubjectStatistics);

// Route lấy thống kê theo mức điểm
router.get("/levels/:level", statisticsController.getByLevel);

export default router;
