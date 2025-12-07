import { Request, Response, NextFunction } from "express";
import SubjectStatisticsService, {
  FilterRequest,
} from "../services/SubjectStatistics.service";

/**
 * StatisticsController - Xử lý HTTP requests cho statistics
 *
 * Design:
 * - 2 endpoint chính: /all (lấy full data) + /filter (filter data)
 * - 1 endpoint metadata: /metadata (danh sách options)
 *
 * Flow:
 * 1. Frontend vào trang → GET /statistics/all (hiển thị tất cả)
 * 2. User chọn filter → GET /statistics/filter?subjects=...&levels=...
 * 3. Lọc dữ liệu đã có (trong bộ nhớ) → Hiển thị chart
 */
export class StatisticsController {
  private service: SubjectStatisticsService;

  constructor(service?: SubjectStatisticsService) {
    this.service = service || new SubjectStatisticsService();
  }

  /**
   * Lấy thống kê TẤT CẢ các môn + tất cả levels
   * Endpoint: GET /api/statistics/all
   *
   * Response:
   * {
   *   success: true,
   *   message: "Lấy thống kê tất cả các môn học thành công",
   *   data: {
   *     toan: { excellent: 100000, good: 200000, average: 150000, poor: 50000, total: 500000 },
   *     ngu_van: { ... },
   *     ...
   *   }
   * }
   */
  getAllStatistics = async (
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
   * Filter thống kê dựa vào FilterRequest
   * Endpoint: GET /api/statistics/filter?subjects=...&levels=...
   *
   * Query Parameters:
   * - subjects: "all" | "toan,ngu_van,vat_li" (danh sách môn phân cách bởi dấu phẩy)
   * - levels: "all" | "excellent,good" (danh sách levels phân cách bởi dấu phẩy)
   *
   * Examples:
   * GET /api/statistics/filter?subjects=all&levels=all
   *   → Tất cả môn, tất cả levels (equivalent to /all)
   *
   * GET /api/statistics/filter?subjects=toan,ngu_van&levels=all
   *   → Chỉ Toán + Văn, tất cả levels
   *
   * GET /api/statistics/filter?subjects=all&levels=excellent,good
   *   → Tất cả môn, chỉ "Xuất sắc" + "Khá"
   *
   * GET /api/statistics/filter?subjects=toan,vat_li&levels=excellent,good
   *   → Chỉ Toán + Vật lý, chỉ "Xuất sắc" + "Khá"
   *
   * Response:
   * {
   *   success: true,
   *   message: "Lọc thống kê ...",
   *   data: {
   *     toan: { excellent: 100000, good: 200000, total: 500000 },
   *     ngu_van: { excellent: 120000, good: 180000, total: 450000 }
   *   }
   * }
   */
  filterStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { subjects, levels } = req.query;

      // Validate required params
      if (!subjects || !levels || typeof subjects !== "string" || typeof levels !== "string") {
        res.status(400).json({
          success: false,
          message:
            'Query parameters "subjects" và "levels" là bắt buộc. ' +
            'Sử dụng "all" để chọn tất cả, hoặc danh sách phân cách bởi dấu phẩy. ' +
            'Ví dụ: ?subjects=toan,ngu_van&levels=excellent,good',
        });
        return;
      }

      // Parse query params
      const subjectsArray = subjects
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const levelsArray = levels
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Validate arrays
      if (subjectsArray.length === 0 || levelsArray.length === 0) {
        res.status(400).json({
          success: false,
          message:
            "subjects và levels không thể trống. Sử dụng \"all\" hoặc danh sách môn/levels",
        });
        return;
      }

      // Build filter request
      const filterRequest: FilterRequest = {
        subjects: subjectsArray,
        levels: levelsArray,
      };

      // Call service
      const result = await this.service.filterStatistics(filterRequest);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy danh sách các option có sẵn (subjects + levels)
   * Endpoint: GET /api/statistics/metadata
   *
   * Sử dụng để populate dropdown/filter options ở frontend
   *
   * Response:
   * {
   *   success: true,
   *   message: "Lấy metadata thành công",
   *   data: {
   *     subjects: [
   *       { key: "toan", name: "Toán" },
   *       { key: "ngu_van", name: "Ngữ Văn" },
   *       ...
   *     ],
   *     levels: [
   *       { key: "excellent", name: "Xuất sắc (≥ 8)" },
   *       { key: "good", name: "Khá (6-8)" },
   *       ...
   *     ]
   *   }
   * }
   */
  getMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subjects = this.service.getAvailableSubjects();
      const levels = this.service.getAvailableLevels();

      res.status(200).json({
        success: true,
        message: "Lấy metadata thành công",
        data: {
          subjects,
          levels,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default StatisticsController;
