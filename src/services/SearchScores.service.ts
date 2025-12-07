import BangDiemRepository from "../repositories/BangDiemRepository";
import { NotFoundError } from "../middleware/httpError";
import ScoresMapper from "./ScoresMapper";

export interface IScoresResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Service chịu trách nhiệm tìm kiếm điểm
 * (Single Responsibility - Search operations)
 */
export class SearchScoresService {
  private repository: BangDiemRepository;
  private mapper: ScoresMapper;

  constructor(repository?: BangDiemRepository, mapper?: ScoresMapper) {
    this.repository = repository || new BangDiemRepository();
    this.mapper = mapper || new ScoresMapper();
  }

  /**
   * Tìm kiếm theo số báo danh
   */
  async searchBySBD(sbd: string): Promise<IScoresResponse> {
    const result = await this.repository.findBySbd(sbd);

    if (!result) {
      throw new NotFoundError(
        "Không tìm thấy thông tin điểm với số báo danh này"
      );
    }

    return {
      success: true,
      message: "Tìm kiếm thành công",
      data: this.mapper.toDetailedResponse(result),
    };
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
