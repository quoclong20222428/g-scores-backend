import BangDiemRepository from "../repositories/BangDiemRepository";
import ScoresMapper from "./ScoresMapper";
import BlockScoresCalculator, { BlockType } from "./BlockScoresCalculator";

export interface IScoresResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Service chịu trách nhiệm xử lý điểm theo khối
 * (Single Responsibility - Block scores operations)
 */
export class BlockScoresService {
  private repository: BangDiemRepository;
  private mapper: ScoresMapper;
  private calculator: BlockScoresCalculator;

  constructor(
    repository?: BangDiemRepository,
    mapper?: ScoresMapper,
    calculator?: BlockScoresCalculator
  ) {
    this.repository = repository || new BangDiemRepository();
    this.mapper = mapper || new ScoresMapper();
    this.calculator = calculator || new BlockScoresCalculator();
  }

  /**
   * Lấy top N thí sinh có điểm cao nhất theo khối
   */
  async getTopByBlock(
    blockType: BlockType,
    limit: number = 10
  ): Promise<IScoresResponse> {
    const allRecords = await this.repository.findAll();

    // Tính và sắp xếp theo tổng điểm khối
    const sortedResults = this.calculator.calculateAndSort(
      allRecords,
      blockType
    );

    // Lấy top N
    const topResults = sortedResults.slice(0, limit).map((entry) => ({
      ...this.mapper.toDetailedResponse(entry.item),
      tongDiemKhoi: entry.score,
    }));

    return {
      success: true,
      message: `Top ${topResults.length} thí sinh khối ${blockType}`,
      data: {
        block: blockType,
        limit,
        total: sortedResults.length,
        results: topResults,
      },
    };
  }

  /**
   * Lấy danh sách thí sinh theo khối có lọc và phân trang
   */
  async getByBlock(
    blockType: BlockType,
    options?: {
      minScore?: number;
      skip?: number;
      take?: number;
    }
  ): Promise<IScoresResponse> {
    const allRecords = await this.repository.findAll();

    // Tính và sắp xếp theo khối
    let sortedResults = this.calculator.calculateAndSort(allRecords, blockType);

    // Lọc theo điểm tối thiểu nếu có
    if (options?.minScore !== undefined) {
      sortedResults = this.calculator.filterByMinScore(
        sortedResults,
        options.minScore
      );
    }

    // Phân trang
    const skip = options?.skip || 0;
    const take = options?.take || 10;
    const paginatedResults = sortedResults
      .slice(skip, skip + take)
      .map((entry) => ({
        ...this.mapper.toDetailedResponse(entry.item),
        tongDiemKhoi: entry.score,
      }));

    return {
      success: true,
      message: `Danh sách thí sinh khối ${blockType}`,
      data: {
        block: blockType,
        items: paginatedResults,
        total: sortedResults.length,
        skip,
        take,
      },
    };
  }
}

export default BlockScoresService;
