import { Request, Response, NextFunction } from "express";
import TopScoresService from "../services/topScores.service";
import { BlockType } from "../repositories/topScoresOptimized.query";

/**
 * TopScoresController - HTTP handlers for top scores endpoints
 *
 * Endpoints:
 * - GET /top/:block - Get top 10 by block
 * - GET /top/:block?limit=20 - Get top N by block
 * - GET /top/:block?minScore=20 - Get top scores with min threshold
 * - GET /top - Get all blocks top scores
 * - GET /student/:sbd/ranks - Check if student is in top 10
 * - GET /blocks - Get block information
 */
export class TopScoresController {
  private service: TopScoresService;

  constructor(service?: TopScoresService) {
    this.service = service || new TopScoresService();
  }

  /**
   * Get top scores by block
   * GET /api/scores/top/:block
   *
   * Query Parameters:
   * - limit: number (default: 10)
   * - minScore: number (optional, filter minimum score)
   *
   * Example:
   * GET /api/scores/top/A?limit=10
   * GET /api/scores/top/B?minScore=20&limit=15
   */
  getTopByBlock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { block } = req.params;
      const { limit, minScore } = req.query;

      // Validate block
      if (!["A", "B", "C", "D"].includes(block)) {
        res.status(400).json({
          success: false,
          message: "Invalid block. Must be A, B, C, or D",
        });
        return;
      }

      // Parse limit
      let parsedLimit = 10;
      if (limit) {
        parsedLimit = parseInt(limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          res.status(400).json({
            success: false,
            message: "Invalid limit. Must be a positive number",
          });
          return;
        }
      }

      // Parse minScore
      let parsedMinScore: number | null = null;
      if (minScore) {
        parsedMinScore = parseFloat(minScore as string);
        if (isNaN(parsedMinScore) || parsedMinScore < 0) {
          res.status(400).json({
            success: false,
            message: "Invalid minScore. Must be a positive number",
          });
          return;
        }
      }

      // Get top scores
      let result;
      if (parsedMinScore !== null) {
        result = await this.service.getTopScoresWithMinScore(
          block as BlockType,
          parsedMinScore,
          parsedLimit
        );
      } else {
        result = await this.service.getTopScoresByBlock(
          block as BlockType,
          parsedLimit
        );
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all blocks top scores
   * GET /api/scores/top
   *
   * Query Parameters:
   * - limit: number (default: 10, applies to all blocks)
   *
   * Example:
   * GET /api/scores/top
   * GET /api/scores/top?limit=20
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     A: [...],
   *     B: [...],
   *     C: [...],
   *     D: [...]
   *   }
   * }
   */
  getAllBlocksTop = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit } = req.query;

      // Parse limit
      let parsedLimit = 10;
      if (limit) {
        parsedLimit = parseInt(limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          res.status(400).json({
            success: false,
            message: "Invalid limit. Must be a positive number",
          });
          return;
        }
      }

      const result = await this.service.getAllBlocksTopScores(parsedLimit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if student is in top 10 of any block
   * GET /api/scores/student/:sbd/ranks
   *
   * Example:
   * GET /api/scores/student/020123456/ranks
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     sbd: "020123456",
   *     ranks: [
   *       { block: "A", rank: 5, total_score: 28.5 },
   *       { block: "D", rank: 12, total_score: 27.0 }
   *     ]
   *   }
   * }
   */
  getStudentRanks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sbd } = req.params;

      // Validate SBD
      if (!sbd || sbd.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "Student ID is required",
        });
        return;
      }

      const result = await this.service.getStudentTopRanks(sbd);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get block information
   * GET /api/scores/blocks
   *
   * Response:
   * {
   *   success: true,
   *   data: [
   *     { block: "A", name: "Khối A", subjects: ["Toán", "Vật lý", "Hóa học"] },
   *     ...
   *   ]
   * }
   */
  getBlocksInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = this.service.getBlockInfo();
      res.status(200).json({
        success: true,
        message: "Block information",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Invalidate top scores cache (admin endpoint)
   * POST /api/scores/cache/invalidate
   *
   * Body:
   * {
   *   block: "A" | "B" | "C" | "D" | "all"
   * }
   */
  invalidateCache = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { block } = req.body;

      // Validate block
      if (!block || !["A", "B", "C", "D", "all"].includes(block)) {
        res.status(400).json({
          success: false,
          message: "Invalid block. Must be A, B, C, D, or all",
        });
        return;
      }

      const result = await this.service.invalidateCache(block);

      res.status(200).json({
        success: result,
        message: `Cache invalidated for block ${block}`,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TopScoresController;
