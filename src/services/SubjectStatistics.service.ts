import BangDiemRepository from "../repositories/BangDiemRepository";
import OptimizedStatisticsQuery, {
  StatisticsData,
  ScoreLevels,
} from "../repositories/OptimizedStatisticsQuery";
import CacheManager from "../utils/CacheManager";

export type ScoreLevel = "excellent" | "good" | "average" | "poor";

/**
 * Filter request interface
 * Sử dụng "all" để chọn tất cả, hoặc chỉ định danh sách cụ thể
 *
 * Ví dụ:
 * { subjects: ["all"], levels: ["all"] }                    → Tất cả data
 * { subjects: ["toan", "ngu_van"], levels: ["all"] }        → 2 môn, tất cả levels
 * { subjects: ["all"], levels: ["excellent", "good"] }      → Tất cả môn, 2 levels
 * { subjects: ["toan"], levels: ["excellent"] }             → 1 môn, 1 level
 */
export interface FilterRequest {
  subjects: string[];  // "all" | ["toan", "ngu_van", ...]
  levels: string[];    // "all" | ["excellent", "good", ...]
}

export interface FilterResponse {
  success: boolean;
  message: string;
  data: Record<string, Partial<ScoreLevels>>;
}

export interface StatisticsResponse {
  success: boolean;
  message: string;
  data: StatisticsData;
}

/**
 * Service chịu trách nhiệm thống kê điểm theo môn học
 * Sử dụng OptimizedStatisticsQuery để lấy dữ liệu tối ưu (< 150ms)
 *
 * Design principle:
 * 1. Query 1 lần duy nhất lấy toàn bộ data
 * 2. Cache toàn bộ data (Redis TTL 1 giờ)
 * 3. Lọc trong bộ nhớ (< 1ms) dựa vào filter request
 * 4. Frontend quyết định filter: lần đầu = "all", sau đó user chọn
 */
export class SubjectStatisticsService {
  private repository: BangDiemRepository;
  private queryHelper: OptimizedStatisticsQuery;

  // Danh sách tất cả môn học
  private readonly ALL_SUBJECTS = [
    "toan",
    "ngu_van",
    "ngoai_ngu",
    "vat_li",
    "hoa_hoc",
    "sinh_hoc",
    "lich_su",
    "dia_li",
    "gdcd",
  ];

  // Danh sách tất cả mức điểm
  private readonly ALL_LEVELS: ScoreLevel[] = [
    "excellent",
    "good",
    "average",
    "poor",
  ];

  // Tên môn học (để hiển thị)
  private readonly SUBJECT_NAMES: Record<string, string> = {
    toan: "Toán",
    ngu_van: "Ngữ Văn",
    ngoai_ngu: "Ngoại Ngữ",
    vat_li: "Vật Lý",
    hoa_hoc: "Hóa Học",
    sinh_hoc: "Sinh Học",
    lich_su: "Lịch Sử",
    dia_li: "Địa Lý",
    gdcd: "GDCD",
  };

  constructor(
    repository?: BangDiemRepository,
    queryHelper?: OptimizedStatisticsQuery
  ) {
    this.repository = repository || new BangDiemRepository();
    this.queryHelper = queryHelper || new OptimizedStatisticsQuery();
  }

  /**
   * Lấy thống kê TẤT CẢ các môn học (full data)
   * Thường gọi lần đầu khi user vào trang
   * Query time: 50-150ms (đầu tiên), < 1ms nếu cache hit
   *
   * Logic:
   * 1. Check cache (Redis)
   * 2. Nếu cache miss → query database → lưu vào cache
   * 3. Return data
   */
  async getAllSubjectsStatistics(): Promise<StatisticsResponse> {
    try {
      // Bước 1: Check cache
      let statistics = await CacheManager.getFullStatistics<StatisticsData>();

      if (statistics) {
        console.log("[Statistics] Cache HIT - Full data retrieved from Redis");
        return {
          success: true,
          message: "Lấy thống kê tất cả các môn học thành công (from cache)",
          data: statistics,
        };
      }

      // Bước 2: Cache miss - Query database
      console.log("[Statistics] Cache MISS - Querying database...");
      statistics = await this.queryHelper.getStatistics();

      // Bước 3: Lưu vào cache (async, không cần await)
      CacheManager.setFullStatistics(statistics)
        .then((success) => {
          if (success) {
            console.log("[Statistics] Data cached successfully (TTL: 1 hour)");
          }
        })
        .catch((error) => {
          console.error("[Statistics] Error caching data:", error);
        });

      return {
        success: true,
        message: "Lấy thống kê tất cả các môn học thành công",
        data: statistics,
      };
    } catch (error) {
      console.error("[Statistics] Error in getAllSubjectsStatistics:", error);
      throw error;
    }
  }

  /**
   * Filter statistics dựa vào FilterRequest
   *
   * Logic:
   * 1. Check cache để lấy full data
   * 2. Lọc dữ liệu (subjects + levels)
   * 3. Return filtered data
   *
   * Nếu cache miss → gọi getAllSubjectsStatistics() (sẽ query + cache)
   *
   * @param filter - Filter request với subjects + levels
   * @returns Filtered data
   *
   * @example
   * // Lần đầu - hiển thị tất cả
   * filterStatistics({ subjects: ["all"], levels: ["all"] })
   *
   * // User chọn 2 môn, all levels
   * filterStatistics({ subjects: ["toan", "ngu_van"], levels: ["all"] })
   *
   * // User chọn all môn, 2 levels
   * filterStatistics({ subjects: ["all"], levels: ["excellent", "good"] })
   *
   * // User chọn cụ thể: 2 môn + 2 levels
   * filterStatistics({
   *   subjects: ["toan", "ngu_van"],
   *   levels: ["excellent", "good"]
   * })
   */
  async filterStatistics(filter: FilterRequest): Promise<FilterResponse> {
    try {
      // Validate filter
      this.validateFilter(filter);

      // Bước 1: Check cache để lấy full data
      let allStats = await CacheManager.getFullStatistics<StatisticsData>();

      // Nếu cache miss → query database + cache
      if (!allStats) {
        const result = await this.getAllSubjectsStatistics();
        allStats = result.data;
      }

      // Bước 2: Xác định subjects cần lọc
      const subjectsToShow = filter.subjects.includes("all")
        ? this.ALL_SUBJECTS
        : filter.subjects.filter((s) => this.ALL_SUBJECTS.includes(s));

      // Xác định levels cần lọc
      const levelsToShow =
        filter.levels.includes("all")
          ? this.ALL_LEVELS
          : (filter.levels
              .filter((l) => this.ALL_LEVELS.includes(l as ScoreLevel))
              .map((l) => l as ScoreLevel));

      // Bước 3: Lọc dữ liệu
      const filtered: Record<string, Partial<ScoreLevels>> = {};

      subjectsToShow.forEach((subject) => {
        const allLevels = (allStats as any)[subject];

        // Chỉ giữ levels được yêu cầu
        filtered[subject] = {
          total: allLevels.total,
        } as Partial<ScoreLevels>;

        levelsToShow.forEach((level) => {
          (filtered[subject] as any)[level] = allLevels[level];
        });
      });

      // Tạo message mô tả
      const subjectsDesc =
        filter.subjects.includes("all")
          ? "tất cả môn"
          : `${subjectsToShow.length} môn`;
      const levelsDesc =
        filter.levels.includes("all")
          ? "tất cả levels"
          : `${levelsToShow.length} levels`;

      return {
        success: true,
        message: `Lọc thống kê ${subjectsDesc} × ${levelsDesc} thành công`,
        data: filtered,
      };
    } catch (error) {
      console.error("[Statistics] Error in filterStatistics:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả môn học có sẵn (không cached)
   */
  getAvailableSubjects(): Array<{ key: string; name: string }> {
    return this.ALL_SUBJECTS.map((key) => ({
      key,
      name: this.SUBJECT_NAMES[key],
    }));
  }

  /**
   * Lấy danh sách tất cả môn học với caching Redis
   * Cache TTL: 1 giờ (metadata ít thay đổi)
   */
  async getAvailableSubjectsCached(): Promise<
    Array<{ key: string; name: string }>
  > {
    const cacheKey = "metadata:subjects";
    const cacheTTL = 3600; // 1 hour

    // Check cache
    const cached = await CacheManager.get<
      Array<{ key: string; name: string }>
    >(cacheKey);
    if (cached) {
      console.log("[Cache HIT] Metadata subjects");
      return cached;
    }

    console.log("[Cache MISS] Metadata subjects - Building from definition");

    // Build data
    const subjects = this.getAvailableSubjects();

    // Cache result
    await CacheManager.set(cacheKey, subjects, cacheTTL);
    console.log(`[Cache SET] Metadata subjects with TTL ${cacheTTL}s`);

    return subjects;
  }

  /**
   * Lấy danh sách tất cả mức điểm (không dùng nữa, cố định ở frontend)
   * @deprecated Levels được định nghĩa cố định ở frontend
   */
  getAvailableLevels(): Array<{ key: ScoreLevel; name: string }> {
    return [
      { key: "excellent", name: "Xuất sắc (≥ 8)" },
      { key: "good", name: "Khá (6-8)" },
      { key: "average", name: "Trung bình (4-6)" },
      { key: "poor", name: "Yếu (< 4)" },
    ];
  }

  /**
   * Validate filter request
   * @throws Error nếu filter không hợp lệ
   */
  private validateFilter(filter: FilterRequest): void {
    if (!filter.subjects || !Array.isArray(filter.subjects)) {
      throw new Error(
        'FilterRequest phải có "subjects" là array. Sử dụng ["all"] để chọn tất cả'
      );
    }

    if (!filter.levels || !Array.isArray(filter.levels)) {
      throw new Error(
        'FilterRequest phải có "levels" là array. Sử dụng ["all"] để chọn tất cả'
      );
    }

    if (filter.subjects.length === 0) {
      throw new Error('FilterRequest subjects không thể trống');
    }

    if (filter.levels.length === 0) {
      throw new Error('FilterRequest levels không thể trống');
    }

    // Validate subjects
    if (!filter.subjects.includes("all")) {
      const invalidSubjects = filter.subjects.filter(
        (s) => !this.ALL_SUBJECTS.includes(s)
      );
      if (invalidSubjects.length > 0) {
        throw new Error(
          `Môn học không hợp lệ: ${invalidSubjects.join(", ")}. Chọn từ: ${this.ALL_SUBJECTS.join(", ")}`
        );
      }
    }

    // Validate levels
    if (!filter.levels.includes("all")) {
      const invalidLevels = filter.levels.filter(
        (l) => !this.ALL_LEVELS.includes(l as ScoreLevel)
      );
      if (invalidLevels.length > 0) {
        throw new Error(
          `Mức điểm không hợp lệ: ${invalidLevels.join(", ")}. Chọn từ: ${this.ALL_LEVELS.join(", ")}`
        );
      }
    }
  }
}

export default SubjectStatisticsService;
