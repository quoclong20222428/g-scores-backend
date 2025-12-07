import { Router } from "express";
import TopScoresController from "../controllers/topScores.controller";

const router = Router();
const topScoresController = new TopScoresController();

/**
 * Top Scores Routes
 *
 * Tìm kiếm top 10 thí sinh theo khối
 * - Optimized SQL query (< 10ms)
 * - Redis caching (TTL 1 hour)
 * - NULL safe (loại bỏ thí sinh thiếu môn)
 */

/**
 * GET /api/scores/top/:block
 * Get top scores by block (A, B, C, D)
 *
 * Query Parameters:
 * - limit: number (default: 10)
 * - minScore: number (optional, filter by minimum total score)
 *
 * Examples:
 * GET /api/scores/top/A
 * GET /api/scores/top/B?limit=20
 * GET /api/scores/top/C?minScore=20&limit=15
 *
 * Blocks:
 * - A: Toán + Lý + Hóa
 * - B: Toán + Hóa + Sinh
 * - C: Văn + Sử + Địa
 * - D: Toán + Văn + Anh
 */
router.get("/top/:block", topScoresController.getTopByBlock);

/**
 * GET /api/scores/top
 * Get all blocks top scores
 *
 * Query Parameters:
 * - limit: number (default: 10, applies to all blocks)
 *
 * Example:
 * GET /api/scores/top
 * GET /api/scores/top?limit=20
 *
 * Response: Object with keys A, B, C, D
 */
router.get("/top", topScoresController.getAllBlocksTop);

/**
 * GET /api/scores/student/:sbd/ranks
 * Check if student is in top 10 of any block
 *
 * Example:
 * GET /api/scores/student/020123456/ranks
 *
 * Response:
 * {
 *   sbd: "020123456",
 *   ranks: [
 *     { block: "A", rank: 5, total_score: 28.5 },
 *     { block: "D", rank: 12, total_score: 27.0 }
 *   ]
 * }
 */
router.get("/student/:sbd/ranks", topScoresController.getStudentRanks);

/**
 * GET /api/scores/blocks
 * Get block information
 *
 * Response: Array of block info (subjects, names, etc.)
 */
router.get("/blocks", topScoresController.getBlocksInfo);

/**
 * POST /api/scores/cache/invalidate (Admin Only)
 * Invalidate top scores cache after bulk updates
 *
 * Body:
 * {
 *   block: "A" | "B" | "C" | "D" | "all"
 * }
 */
router.post("/cache/invalidate", topScoresController.invalidateCache);

export default router;
