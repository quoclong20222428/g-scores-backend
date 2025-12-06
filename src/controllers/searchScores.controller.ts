import { Request, Response, NextFunction } from "express";
import ScoresService from "../services/ScoresService";

export class ScoresController {
  private service: ScoresService;

  constructor(service?: ScoresService) {
    this.service = service || new ScoresService();
  }

  searchScores = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sbd } = req.params;
      const result = await this.service.searchBySBD(sbd);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { skip, take } = req.query;
      const options = {
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      };
      const result = await this.service.getAll(options);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  searchByConditions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const conditions = req.query;
      const result = await this.service.searchByConditions(conditions);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy top 10 thí sinh theo khối
   * GET /api/scores/top/:block?limit=10
   */
  getTopByBlock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { block } = req.params;
      const { limit } = req.query;

      // Validate block type
      if (!["A", "B", "C", "D"].includes(block.toUpperCase())) {
        res.status(400).json({
          success: false,
          message: "Khối không hợp lệ. Vui lòng chọn A, B, C hoặc D",
        });
        return;
      }

      const result = await this.service.getTopByBlock(
        block.toUpperCase() as "A" | "B" | "C" | "D",
        limit ? Number(limit) : 10
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy danh sách thí sinh theo khối có lọc và phân trang
   * GET /api/scores/block/:block?minScore=20&skip=0&take=10
   */
  getByBlock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { block } = req.params;
      const { minScore, skip, take } = req.query;

      // Validate block type
      if (!["A", "B", "C", "D"].includes(block.toUpperCase())) {
        res.status(400).json({
          success: false,
          message: "Khối không hợp lệ. Vui lòng chọn A, B, C hoặc D",
        });
        return;
      }

      const options = {
        minScore: minScore ? Number(minScore) : undefined,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
      };

      const result = await this.service.getByBlock(
        block.toUpperCase() as "A" | "B" | "C" | "D",
        options
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default ScoresController;