import { Request, Response, NextFunction } from "express";
import SubjectStatisticsService, {
  ScoreLevel,
} from "../services/SubjectStatisticsService";

export class StatisticsController {
  private service: SubjectStatisticsService;

  constructor(service?: SubjectStatisticsService) {
    this.service = service || new SubjectStatisticsService();
  }

  /**
   * Lấy thống kê tất cả các môn học
   * GET /api/statistics/subjects
   */
  getAllSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.getAllSubjectsStatistics();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê của một môn học cụ thể
   * GET /api/statistics/subjects/:subject
   */
  getSubjectStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { subject } = req.params;
      const result = await this.service.getSubjectStatistics(subject);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy thống kê theo mức điểm
   * GET /api/statistics/levels/:level
   */
  getByLevel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { level } = req.params;

      // Validate level
      const validLevels: ScoreLevel[] = [
        "excellent",
        "good",
        "average",
        "poor",
      ];
      if (!validLevels.includes(level as ScoreLevel)) {
        res.status(400).json({
          success: false,
          message:
            "Mức điểm không hợp lệ. Vui lòng chọn: excellent, good, average, poor",
        });
        return;
      }

      const result = await this.service.getStatisticsByLevel(
        level as ScoreLevel
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default StatisticsController;
