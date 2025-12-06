import BangDiemRepository from "../repositories/BangDiemRepository";
import BangDiem from "../model/BangDiem";

export type ScoreLevel = "excellent" | "good" | "average" | "poor";

export interface ScoreLevelRange {
  level: ScoreLevel;
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface SubjectStatistics {
  subject: string;
  subjectName: string;
  total: number;
  levels: ScoreLevelRange[];
}

export interface StatisticsResponse {
  success: boolean;
  message: string;
  data: {
    statistics: SubjectStatistics[];
    totalRecords: number;
  };
}

/**
 * Service chịu trách nhiệm thống kê điểm theo môn học
 * (Statistics & Reporting - Single Responsibility)
 */
export class SubjectStatisticsService {
  private repository: BangDiemRepository;

  // Định nghĩa các mức điểm
  private readonly SCORE_LEVELS: Omit<ScoreLevelRange, "count">[] = [
    { level: "excellent", label: "Xuất sắc (≥ 8)", min: 8, max: 10 },
    { level: "good", label: "Khá (6 ≤ điểm < 8)", min: 6, max: 8 },
    { level: "average", label: "Trung bình (4 ≤ điểm < 6)", min: 4, max: 6 },
    { level: "poor", label: "Yếu (< 4)", min: 0, max: 4 },
  ];

  // Danh sách môn học
  private readonly SUBJECTS = [
    { key: "toan", name: "Toán" },
    { key: "ngu_van", name: "Ngữ Văn" },
    { key: "ngoai_ngu", name: "Ngoại Ngữ" },
    { key: "vat_li", name: "Vật Lý" },
    { key: "hoa_hoc", name: "Hóa Học" },
    { key: "sinh_hoc", name: "Sinh Học" },
    { key: "lich_su", name: "Lịch Sử" },
    { key: "dia_li", name: "Địa Lý" },
    { key: "gdcd", name: "GDCD" },
  ];

  constructor(repository?: BangDiemRepository) {
    this.repository = repository || new BangDiemRepository();
  }

  /**
   * Phân loại điểm vào các mức
   */
  private classifyScore(score: number | null): ScoreLevel | null {
    if (score === null) return null;

    if (score >= 8) return "excellent";
    if (score >= 6) return "good";
    if (score >= 4) return "average";
    return "poor";
  }

  /**
   * Thống kê điểm của một môn học
   */
  private analyzeSubject(
    records: BangDiem[],
    subjectKey: string
  ): { total: number; levelCounts: Map<ScoreLevel, number> } {
    const levelCounts = new Map<ScoreLevel, number>([
      ["excellent", 0],
      ["good", 0],
      ["average", 0],
      ["poor", 0],
    ]);

    let total = 0;

    records.forEach((record) => {
      const score = (record as any)[subjectKey];
      
      if (score !== null && score !== undefined) {
        total++;
        const level = this.classifyScore(score);
        if (level) {
          levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
        }
      }
    });

    return { total, levelCounts };
  }

  /**
   * Tạo báo cáo thống kê cho một môn học
   */
  private createSubjectReport(
    subjectKey: string,
    subjectName: string,
    records: BangDiem[]
  ): SubjectStatistics {
    const { total, levelCounts } = this.analyzeSubject(records, subjectKey);

    const levels = this.SCORE_LEVELS.map((level) => ({
      ...level,
      count: levelCounts.get(level.level) || 0,
    }));

    return {
      subject: subjectKey,
      subjectName,
      total,
      levels,
    };
  }

  /**
   * Lấy thống kê tất cả các môn học
   */
  async getAllSubjectsStatistics(): Promise<StatisticsResponse> {
    // Lấy tất cả bản ghi
    const allRecords = await this.repository.findAll();
    const totalRecords = allRecords.length;

    // Tạo báo cáo cho từng môn
    const statistics = this.SUBJECTS.map((subject) =>
      this.createSubjectReport(subject.key, subject.name, allRecords)
    );

    return {
      success: true,
      message: "Thống kê điểm theo môn học thành công",
      data: {
        statistics,
        totalRecords,
      },
    };
  }

  /**
   * Lấy thống kê của một môn học cụ thể
   */
  async getSubjectStatistics(subjectKey: string): Promise<StatisticsResponse> {
    // Validate môn học
    const subject = this.SUBJECTS.find((s) => s.key === subjectKey);
    if (!subject) {
      return {
        success: false,
        message: "Môn học không hợp lệ",
        data: {
          statistics: [],
          totalRecords: 0,
        },
      };
    }

    // Lấy tất cả bản ghi
    const allRecords = await this.repository.findAll();
    const totalRecords = allRecords.length;

    // Tạo báo cáo cho môn học
    const statistics = [
      this.createSubjectReport(subject.key, subject.name, allRecords),
    ];

    return {
      success: true,
      message: `Thống kê điểm môn ${subject.name} thành công`,
      data: {
        statistics,
        totalRecords,
      },
    };
  }

  /**
   * Lấy thống kê theo mức điểm
   */
  async getStatisticsByLevel(
    level: ScoreLevel
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      level: ScoreLevel;
      subjects: Array<{ subject: string; subjectName: string; count: number }>;
    };
  }> {
    const allRecords = await this.repository.findAll();

    const subjectCounts = this.SUBJECTS.map((subject) => {
      const { levelCounts } = this.analyzeSubject(allRecords, subject.key);
      return {
        subject: subject.key,
        subjectName: subject.name,
        count: levelCounts.get(level) || 0,
      };
    });

    return {
      success: true,
      message: `Thống kê các môn theo mức ${level}`,
      data: {
        level,
        subjects: subjectCounts,
      },
    };
  }
}

export default SubjectStatisticsService;
