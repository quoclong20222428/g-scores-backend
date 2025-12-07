import { PrismaClient } from "@prisma/client";
import TopScoresOptimizedQuery, {
  BlockType,
  TopScoreResult,
} from "../repositories/topScoresOptimized.query";
import CacheManager from "../utils/CacheManager";

export interface TopScoresResponse {
  success: boolean;
  message: string;
  data: TopScoreResult[];
}

export interface StudentTopRanksResponse {
  success: boolean;
  message: string;
  data: {
    sbd: string;
    ranks: Array<{
      block: BlockType;
      rank: number;
      total_score: number;
    }>;
  };
}

/**
 * TopScoresService - Quản lý top scores với Redis caching
 *
 * Architecture:
 * 1. Check Redis cache first
 * 2. If miss → Query database (Raw SQL, < 10ms)
 * 3. Cache result (TTL 1 hour)
 * 4. Return data
 *
 * Performance:
 * - Cache hit: < 1ms (Redis)
 * - Cache miss: 10ms (DB) + cache setup
 * - Typical hit rate: 95%+ (1 hour TTL)
 */
export class TopScoresService {
  private query: TopScoresOptimizedQuery;

  // Cache key constants
  private readonly CACHE_KEYS = {
    TOP_SCORES_BLOCK: (block: BlockType) => `top_scores:${block}`,
    STUDENT_RANKS: (sbd: string) => `student_ranks:${sbd}`,
  };

  private readonly TTL = {
    TOP_SCORES: 3600, // 1 hour
  };

  constructor(query?: TopScoresOptimizedQuery) {
    this.query =
      query ||
      new TopScoresOptimizedQuery(new PrismaClient());
  }

  /**
   * Get top 10 scores by block
   * Cached for 1 hour
   *
   * @param block - 'A' | 'B' | 'C' | 'D'
   * @param limit - Number of scores (default: 10)
   * @returns Top scores response
   */
  async getTopScoresByBlock(
    block: BlockType,
    limit: number = 10
  ): Promise<TopScoresResponse> {
    // Validate block
    if (!["A", "B", "C", "D"].includes(block)) {
      throw new Error(
        `Invalid block: ${block}. Must be A, B, C, or D`
      );
    }

    const cacheKey = this.CACHE_KEYS.TOP_SCORES_BLOCK(block);

    try {
      // Bước 1: Check cache
      const cached = await CacheManager.get<TopScoreResult[]>(cacheKey);
      if (cached) {
        console.log(
          `[TopScoresService] Cache HIT for block ${block} - ${cached.length} records`
        );
        return {
          success: true,
          message: `Top scores for block ${block} (from cache)`,
          data: cached.slice(0, limit),
        };
      }

      // Bước 2: Cache miss - Query database
      console.log(
        `[TopScoresService] Cache MISS for block ${block} - Querying database`
      );
      const scores = await this.query.getTopScoresByBlock(block);

      // Bước 3: Cache result
      await CacheManager.set(cacheKey, scores, this.TTL.TOP_SCORES);
      console.log(
        `[TopScoresService] Cached top scores for block ${block} (TTL: 1 hour)`
      );

      return {
        success: true,
        message: `Top scores for block ${block}`,
        data: scores.slice(0, limit),
      };
    } catch (error) {
      console.error(
        `[TopScoresService] Error getting top scores for block ${block}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all blocks top scores
   * Cached individually
   *
   * @param limit - Number of scores per block (default: 10)
   * @returns All top scores response
   */
  async getAllBlocksTopScores(
    limit: number = 10
  ): Promise<{
    success: boolean;
    message: string;
    data: Record<BlockType, TopScoreResult[]>;
  }> {
    try {
      const blocks: BlockType[] = ["A", "B", "C", "D"];
      const result: Record<BlockType, TopScoreResult[]> = {} as Record<
        BlockType,
        TopScoreResult[]
      >;

      // Fetch all blocks in parallel
      const promises = blocks.map((block) =>
        this.getTopScoresByBlock(block, limit)
      );
      const responses = await Promise.all(promises);

      // Organize results
      blocks.forEach((block, index) => {
        result[block] = responses[index].data;
      });

      return {
        success: true,
        message: "Top scores for all blocks",
        data: result,
      };
    } catch (error) {
      console.error("[TopScoresService] Error getting all blocks top scores:", error);
      throw error;
    }
  }

  /**
   * Check if student is in top 10 of any block
   *
   * @param sbd - Student ID
   * @returns Student ranks response
   */
  async getStudentTopRanks(sbd: string): Promise<StudentTopRanksResponse> {
    try {
      // Validate SBD
      if (!sbd || sbd.trim().length === 0) {
        throw new Error("Invalid student ID");
      }

      const cacheKey = this.CACHE_KEYS.STUDENT_RANKS(sbd);

      // Check cache first
      const cached = await CacheManager.get<
        Array<{ block: BlockType; rank: number; total_score: number }>
      >(cacheKey);
      if (cached) {
        console.log(`[TopScoresService] Cache HIT for student ${sbd}`);
        return {
          success: true,
          message: `Top ranks for student ${sbd} (from cache)`,
          data: {
            sbd,
            ranks: cached,
          },
        };
      }

      // Query all blocks
      console.log(`[TopScoresService] Cache MISS for student ${sbd}`);
      const ranks = await this.query.getTopRanksBySbd(sbd);

      // Cache result
      await CacheManager.set(cacheKey, ranks, this.TTL.TOP_SCORES);

      return {
        success: true,
        message: `Top ranks for student ${sbd}`,
        data: {
          sbd,
          ranks,
        },
      };
    } catch (error) {
      console.error(
        `[TopScoresService] Error getting student top ranks for ${sbd}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get top scores with minimum score threshold
   *
   * @param block - 'A' | 'B' | 'C' | 'D'
   * @param minScore - Minimum total score
   * @param limit - Number of results
   * @returns Top scores response
   */
  async getTopScoresWithMinScore(
    block: BlockType,
    minScore: number,
    limit: number = 10
  ): Promise<TopScoresResponse> {
    try {
      // Note: Not cached separately since it's a filtered query
      const scores = await this.query.getTopScoresByBlockWithMinScore(
        block,
        minScore,
        limit
      );

      return {
        success: true,
        message: `Top scores for block ${block} with minimum score ${minScore}`,
        data: scores,
      };
    } catch (error) {
      console.error(
        `[TopScoresService] Error getting top scores with min score for block ${block}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Invalidate cache for a block
   * Call after seed or bulk update
   *
   * @param block - 'A' | 'B' | 'C' | 'D' | 'all'
   */
  async invalidateCache(block: BlockType | "all"): Promise<boolean> {
    try {
      if (block === "all") {
        const blocks: BlockType[] = ["A", "B", "C", "D"];
        const promises = blocks.map((b) =>
          CacheManager.delete(this.CACHE_KEYS.TOP_SCORES_BLOCK(b))
        );
        const results = await Promise.all(promises);
        console.log(
          `[TopScoresService] Invalidated cache for all blocks`
        );
        return results.every((r) => r === true);
      } else {
        const result = await CacheManager.delete(
          this.CACHE_KEYS.TOP_SCORES_BLOCK(block)
        );
        console.log(`[TopScoresService] Invalidated cache for block ${block}`);
        return result;
      }
    } catch (error) {
      console.error("[TopScoresService] Error invalidating cache:", error);
      throw error;
    }
  }

  /**
   * Get block info
   */
  getBlockInfo(): Array<{ block: BlockType; name: string; subjects: string[] }> {
    return [
      {
        block: "A",
        name: "Khối A",
        subjects: ["Toán", "Vật lý", "Hóa học"],
      },
      {
        block: "B",
        name: "Khối B",
        subjects: ["Toán", "Hóa học", "Sinh học"],
      },
      {
        block: "C",
        name: "Khối C",
        subjects: ["Ngữ văn", "Lịch sử", "Địa lý"],
      },
      {
        block: "D",
        name: "Khối D",
        subjects: ["Toán", "Ngữ văn", "Ngoại ngữ"],
      },
    ];
  }
}

export default TopScoresService;
