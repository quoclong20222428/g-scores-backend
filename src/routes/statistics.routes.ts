import { Router } from "express";
import StatisticsController from "../controllers/statistics.controller";

const router = Router();
const statisticsController = new StatisticsController();

/**
 * Statistics Routes
 *
 * Design: 3 endpoints chính
 * 1. GET /all - Lấy full data (lần đầu khi user vào trang)
 * 2. GET /filter - Lọc data dựa vào subjects + levels
 * 3. GET /metadata - Lấy danh sách options (subjects + levels)
 */

/**
 * GET /api/statistics/all
 * Lấy thống kê TẤT CẢ các môn học
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     toan: { excellent, good, average, poor, total },
 *     ngu_van: { ... },
 *     ...
 *   }
 * }
 */
router.get("/all", statisticsController.getAllStatistics);

/**
 * GET /api/statistics/filter?subjects=...&levels=...
 * Filter thống kê theo subjects + levels
 *
 * Query Parameters:
 * - subjects: "all" | "toan,ngu_van,vat_li"
 * - levels: "all" | "excellent,good"
 *
 * Examples:
 * ?subjects=all&levels=all
 * ?subjects=toan,ngu_van&levels=all
 * ?subjects=all&levels=excellent,good
 * ?subjects=toan,vat_li&levels=excellent,good
 */
router.get("/filter", statisticsController.filterStatistics);

/**
 * GET /api/statistics/metadata
 * Lấy danh sách các option khả dụng
 *
 * Response:
 * {
 *   data: {
 *     subjects: [{ key, name }, ...],
 *     levels: [{ key, name }, ...]
 *   }
 * }
 */
router.get("/metadata", statisticsController.getMetadata);

export default router;
