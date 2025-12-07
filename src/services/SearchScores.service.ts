import BangDiemRepository from "../repositories/BangDiemRepository";
import { NotFoundError } from "../middleware/httpError";
import ScoresMapper from "./ScoresMapper";
import CacheManager from "../utils/CacheManager";

export interface IScoresResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Service chịu trách nhiệm tìm kiếm điểm
 * (Single Responsibility - Search operations)
 * - Tìm kiếm theo số báo danh (SBD) với Redis cache
 * - Tìm kiếm theo điều kiện
 * - Lấy danh sách phân trang
 */
export class SearchScoresService {
  private repository: BangDiemRepository;
  private mapper: ScoresMapper;

  // Cache keys
  private readonly CACHE_PREFIX = "scores:sbd:";
  private readonly CACHE_TTL = 3600; // 1 hour
  
  // Sentinel value để phân biệt "cache miss" vs "cache hit with null"
  private readonly NOT_FOUND_MARKER = { __notFound: true };

  constructor(repository?: BangDiemRepository, mapper?: ScoresMapper) {
    this.repository = repository || new BangDiemRepository();
    this.mapper = mapper || new ScoresMapper();
  }

  /**
   * Tạo cache key cho SBD
   */
  private getCacheKeyForSBD(sbd: string): string {
    return `${this.CACHE_PREFIX}${sbd}`;
  }

  /**
   * Tìm kiếm theo số báo danh (với caching)
   * Cache cả kết quả không tìm thấy (marker object) để tránh repeated database queries
   */
  async searchBySBD(sbd: string): Promise<IScoresResponse> {
    const cacheKey = this.getCacheKeyForSBD(sbd);

    // Kiểm tra cache trước
    const cachedResult = await CacheManager.get<any>(cacheKey);
    if (cachedResult !== null) {
      // Cache hit - có thể là data hoặc marker object
      console.log(`[Cache HIT] SBD: ${sbd}`);

      // Nếu là marker object, tức là SBD không tìm thấy
      if (
        cachedResult &&
        typeof cachedResult === "object" &&
        cachedResult.__notFound === true
      ) {
        throw new NotFoundError(
          "Không tìm thấy thông tin điểm với số báo danh này"
        );
      }

      return {
        success: true,
        message: "Tìm kiếm thành công (từ cache)",
        data: cachedResult,
      };
    }

    // Cache miss - truy vấn database
    console.log(`[Cache MISS] SBD: ${sbd}`);
    const result = await this.repository.findBySbd(sbd);

    if (!result) {
      // Lưu marker object vào cache để tránh repeated queries cho SBD không hợp lệ
      await CacheManager.set(cacheKey, this.NOT_FOUND_MARKER, this.CACHE_TTL);
      console.log(`[Cache SET NOT_FOUND] SBD: ${sbd}`);
      throw new NotFoundError(
        "Không tìm thấy thông tin điểm với số báo danh này"
      );
    }

    const mappedResult = this.mapper.toDetailedResponse(result);

    // Lưu vào cache
    await CacheManager.set(cacheKey, mappedResult, this.CACHE_TTL);
    console.log(`[Cache SET] SBD: ${sbd}`);

    return {
      success: true,
      message: "Tìm kiếm thành công",
      data: mappedResult,
    };
  }

  /**
   * Xóa cache cho một SBD cụ thể
   * (Gọi sau khi update/delete dữ liệu)
   */
  async invalidateSBDCache(sbd: string): Promise<void> {
    const cacheKey = this.getCacheKeyForSBD(sbd);
    await CacheManager.delete(cacheKey);
    console.log(`[Cache INVALIDATED] SBD: ${sbd}`);
  }

  /**
   * Xóa tất cả cache SBD
   * (Gọi sau khi bulk update)
   */
  async invalidateAllSBDCache(): Promise<void> {
    // Xóa tất cả cache (có thể cải thiện bằng cách track keys)
    await CacheManager.clear();
    console.log("[Cache INVALIDATED] All SBD cache cleared");
  }

  /**
   * Tìm kiếm theo điều kiện
   */
  async searchByConditions(conditions: {
    toan_gte?: number;
    toan_lte?: number;
    ngu_van_gte?: number;
    ngu_van_lte?: number;
    ma_ngoai_ngu?: string;
  }): Promise<IScoresResponse> {
    const results = await this.repository.findWhere(conditions);

    return {
      success: true,
      message: `Tìm thấy ${results.length} kết quả`,
      data: this.mapper.toDetailedList(results),
    };
  }

  /**
   * Lấy tất cả bản ghi có phân trang
   */
  async getAll(options?: {
    skip?: number;
    take?: number;
  }): Promise<IScoresResponse> {
    const results = await this.repository.findAll(options);
    const total = await this.repository.count();

    return {
      success: true,
      message: "Lấy danh sách thành công",
      data: {
        items: this.mapper.toSimpleList(results),
        total,
        skip: options?.skip || 0,
        take: options?.take || results.length,
      },
    };
  }
}

export default SearchScoresService;
