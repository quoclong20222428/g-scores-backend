import BangDiemRepository from "../repositories/BangDiemRepository";
import SearchScoresService from "./SearchScores.service";
import BlockScoresService from "./BlockScores.service";
import ScoresMapper from "./ScoresMapper";
import BlockScoresCalculator, { BlockType } from "./BlockScoresCalculator";

export interface IScoresResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Main Scores Service - Facade Pattern
 * Tập hợp tất cả các service con để cung cấp API đơn giản
 */
export class ScoresService {
  private searchService: SearchScoresService;
  private blockService: BlockScoresService;

  constructor(
    repository?: BangDiemRepository,
    mapper?: ScoresMapper,
    calculator?: BlockScoresCalculator
  ) {
    const repo = repository || new BangDiemRepository();
    const map = mapper || new ScoresMapper();
    const calc = calculator || new BlockScoresCalculator();

    this.searchService = new SearchScoresService(repo, map);
    this.blockService = new BlockScoresService(repo, map, calc);
  }

  // ==================== SEARCH OPERATIONS ====================

  async searchBySBD(sbd: string): Promise<IScoresResponse> {
    return this.searchService.searchBySBD(sbd);
  }

  async searchByConditions(conditions: {
    toan_gte?: number;
    toan_lte?: number;
    ngu_van_gte?: number;
    ngu_van_lte?: number;
    ma_ngoai_ngu?: string;
  }): Promise<IScoresResponse> {
    return this.searchService.searchByConditions(conditions);
  }

  async getAll(options?: {
    skip?: number;
    take?: number;
  }): Promise<IScoresResponse> {
    return this.searchService.getAll(options);
  }

  // ==================== BLOCK OPERATIONS ====================

  async getTopByBlock(
    blockType: BlockType,
    limit: number = 10
  ): Promise<IScoresResponse> {
    return this.blockService.getTopByBlock(blockType, limit);
  }

  async getByBlock(
    blockType: BlockType,
    options?: {
      minScore?: number;
      skip?: number;
      take?: number;
    }
  ): Promise<IScoresResponse> {
    return this.blockService.getByBlock(blockType, options);
  }
}

export default ScoresService;
