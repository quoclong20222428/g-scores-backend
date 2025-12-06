import BangDiem from "../model/BangDiem";

export type BlockType = "A" | "B" | "C" | "D";

export interface BlockScoreEntry {
  item: BangDiem;
  score: number | null;
}

/**
 * Class chịu trách nhiệm tính toán và xử lý điểm theo khối
 * (Calculator Pattern - Single Responsibility)
 */
export class BlockScoresCalculator {
  /**
   * Tính tổng điểm theo khối cho một BangDiem
   */
  calculateScore(item: BangDiem, blockType: BlockType): number | null {
    switch (blockType) {
      case "A":
        return item.getTongDiemKhoiA();
      case "B":
        return item.getTongDiemKhoiB();
      case "C":
        return item.getTongDiemKhoiC();
      case "D":
        return item.getTongDiemKhoiD();
      default:
        return null;
    }
  }

  /**
   * Tính điểm cho danh sách và trả về mảng entries
   */
  calculateForList(
    items: BangDiem[],
    blockType: BlockType
  ): BlockScoreEntry[] {
    return items.map((item) => ({
      item,
      score: this.calculateScore(item, blockType),
    }));
  }

  /**
   * Lọc các entries có điểm hợp lệ (không null)
   */
  filterValidScores(entries: BlockScoreEntry[]): BlockScoreEntry[] {
    return entries.filter((entry) => entry.score !== null);
  }

  /**
   * Sắp xếp entries theo điểm giảm dần
   */
  sortByScoreDesc(entries: BlockScoreEntry[]): BlockScoreEntry[] {
    return entries.sort((a, b) => (b.score as number) - (a.score as number));
  }

  /**
   * Tính, lọc và sắp xếp điểm theo khối (pipeline)
   */
  calculateAndSort(
    items: BangDiem[],
    blockType: BlockType
  ): BlockScoreEntry[] {
    const entries = this.calculateForList(items, blockType);
    const validEntries = this.filterValidScores(entries);
    return this.sortByScoreDesc(validEntries);
  }

  /**
   * Lọc entries theo điểm tối thiểu
   */
  filterByMinScore(
    entries: BlockScoreEntry[],
    minScore: number
  ): BlockScoreEntry[] {
    return entries.filter((entry) => (entry.score as number) >= minScore);
  }
}

export default BlockScoresCalculator;
