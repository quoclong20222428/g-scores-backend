import { PrismaClient, Prisma } from "@prisma/client";
import BangDiem from "../model/BangDiem";

export type BlockType = "A" | "B" | "C" | "D";

export interface TopScoreResult {
  id: string;
  sbd: string;
  toan: number | null;
  ngu_van: number | null;
  ngoai_ngu: number | null;
  vat_li: number | null;
  hoa_hoc: number | null;
  sinh_hoc: number | null;
  lich_su: number | null;
  dia_li: number | null;
  gdcd: number | null;
  ma_ngoai_ngu: string | null;
  total_score: number;
  rank: number;
}

/**
 * TopScoresOptimizedQuery - Raw SQL Query với CASE WHEN
 *
 * Tối ưu truy vấn top 10 thí sinh theo khối
 * - Query time: < 10ms (database)
 * - NULL safe: loại bỏ thí sinh thiếu môn theo khối
 * - Single query: không cần calculate ở application layer
 *
 * Khối A: Toán + Lý + Hóa
 * Khối B: Toán + Hóa + Sinh
 * Khối C: Văn + Sử + Địa
 * Khối D: Toán + Văn + Anh
 */
export class TopScoresOptimizedQuery {
  constructor(private prisma: PrismaClient) { }

  /**
   * Get top scores by block
   *
   * @param block - 'A' | 'B' | 'C' | 'D'
   * @param limit - Number of top scores (default: 10)
   * @returns Array of top scores with rank
   */
  async getTopScoresByBlock(
    block: BlockType,
    limit: number = 10
  ): Promise<TopScoreResult[]> {
    const limitValue = Math.max(1, Math.min(limit, 1000)); // Clamp between 1-1000

    try {
      let results: TopScoreResult[];

      switch (block) {
        case "A":
          // Khối A: Toán + Lý + Hóa
          results = await this.prisma.$queryRaw<TopScoreResult[]>`
            SELECT 
              id,
              sbd,
              toan,
              vat_li,
              hoa_hoc,
              (COALESCE(toan, 0) + COALESCE(vat_li, 0) + COALESCE(hoa_hoc, 0)) AS total_score,
              CAST(ROW_NUMBER() OVER (ORDER BY (COALESCE(toan, 0) + COALESCE(vat_li, 0) + COALESCE(hoa_hoc, 0)) DESC) AS int) AS rank
            FROM bang_diem
            WHERE toan IS NOT NULL 
              AND vat_li IS NOT NULL 
              AND hoa_hoc IS NOT NULL
            ORDER BY total_score DESC
            LIMIT ${limitValue}
          `;
          break;

        case "B":
          // Khối B: Toán + Hóa + Sinh
          results = await this.prisma.$queryRaw<TopScoreResult[]>`
            SELECT 
              id,
              sbd,
              toan,
              hoa_hoc,
              sinh_hoc,
              (COALESCE(toan, 0) + COALESCE(hoa_hoc, 0) + COALESCE(sinh_hoc, 0)) AS total_score,
              CAST(ROW_NUMBER() OVER (ORDER BY (COALESCE(toan, 0) + COALESCE(hoa_hoc, 0) + COALESCE(sinh_hoc, 0)) DESC) AS int) AS rank
            FROM bang_diem
            WHERE toan IS NOT NULL 
              AND hoa_hoc IS NOT NULL 
              AND sinh_hoc IS NOT NULL
            ORDER BY total_score DESC
            LIMIT ${limitValue}
          `;
          break;

        case "C":
          // Khối C: Văn + Sử + Địa
          results = await this.prisma.$queryRaw<TopScoreResult[]>`
            SELECT 
              id,
              sbd,
              ngu_van,
              lich_su,
              dia_li,
              (COALESCE(ngu_van, 0) + COALESCE(lich_su, 0) + COALESCE(dia_li, 0)) AS total_score,
              CAST(ROW_NUMBER() OVER (ORDER BY (COALESCE(ngu_van, 0) + COALESCE(lich_su, 0) + COALESCE(dia_li, 0)) DESC) AS int) AS rank
            FROM bang_diem
            WHERE ngu_van IS NOT NULL 
              AND lich_su IS NOT NULL 
              AND dia_li IS NOT NULL
            ORDER BY total_score DESC
            LIMIT ${limitValue}
          `;
          break;

        case "D":
          // Khối D: Toán + Văn + Anh
          results = await this.prisma.$queryRaw<TopScoreResult[]>`
            SELECT 
              id,
              sbd,
              toan,
              ngu_van,
              ngoai_ngu,
              ma_ngoai_ngu,
              (COALESCE(toan, 0) + COALESCE(ngu_van, 0) + COALESCE(ngoai_ngu, 0)) AS total_score,
              CAST(ROW_NUMBER() OVER (ORDER BY (COALESCE(toan, 0) + COALESCE(ngu_van, 0) + COALESCE(ngoai_ngu, 0)) DESC) AS int) AS rank
            FROM bang_diem
            WHERE toan IS NOT NULL 
              AND ngu_van IS NOT NULL 
              AND ngoai_ngu IS NOT NULL
            ORDER BY total_score DESC
            LIMIT ${limitValue}
          `;
          break;

        default:
          throw new Error(`Invalid block: ${block}. Must be A, B, C, or D`);
      }

      return results;
    } catch (error) {
      console.error(
        `[TopScoresOptimizedQuery] Error fetching top scores for block ${block}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get top scores for a specific student (by SBD)
   * Check if student is in top 10 of any block
   *
   * @param sbd - Student ID
   * @returns Array of blocks where student is in top 10
   */
  async getTopRanksBySbd(
    sbd: string
  ): Promise<{ block: BlockType; rank: number; total_score: number }[]> {
    const blocks: BlockType[] = ["A", "B", "C", "D"];
    const results: { block: BlockType; rank: number; total_score: number }[] =
      [];

    for (const block of blocks) {
      const topScores = await this.getTopScoresByBlock(block, 10);
      const studentRank = topScores.find((s) => s.sbd === sbd);

      if (studentRank) {
        results.push({
          block,
          rank: studentRank.rank,
          total_score: studentRank.total_score,
        });
      }
    }

    return results;
  }

  /**
   * Get top scores with minimum score threshold
   * Example: Top scores in block A with minimum 20 points
   *
   * @param block - 'A' | 'B' | 'C' | 'D'
   * @param minScore - Minimum total score
   * @param limit - Number of results
   * @returns Array of scores
   */
  async getTopScoresByBlockWithMinScore(
    block: BlockType,
    minScore: number,
    limit: number = 10
  ): Promise<TopScoreResult[]> {
    const allTopScores = await this.getTopScoresByBlock(block, 1000); // Get more than needed
    return allTopScores
      .filter((score) => score.total_score >= minScore)
      .slice(0, limit);
  }

  /**
   * Get score rank in specific block for a student
   *
   * @param sbd - Student ID
   * @param block - 'A' | 'B' | 'C' | 'D'
   * @returns Student rank or null if not qualified
   */
  async getRankInBlock(
    sbd: string,
    block: BlockType
  ): Promise<{ rank: number; total_score: number } | null> {
    const topScores = await this.getTopScoresByBlock(block, 10);
    const student = topScores.find((s) => s.sbd === sbd);
    return student
      ? { rank: student.rank, total_score: student.total_score }
      : null;
  }
}

export default TopScoresOptimizedQuery;
