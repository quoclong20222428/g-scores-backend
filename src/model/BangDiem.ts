import { PrismaClient, BangDiem as PrismaBangDiem } from "@prisma/client";

const prisma = new PrismaClient();

export interface IBangDiem {
  id?: number;
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
}

export interface ICreateBangDiem {
  sbd: string;
  toan?: number | null;
  ngu_van?: number | null;
  ngoai_ngu?: number | null;
  vat_li?: number | null;
  hoa_hoc?: number | null;
  sinh_hoc?: number | null;
  lich_su?: number | null;
  dia_li?: number | null;
  gdcd?: number | null;
  ma_ngoai_ngu?: string | null;
}

export class BangDiem implements IBangDiem {
  id?: number;
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

  constructor(data: IBangDiem) {
    this.id = data.id;
    this.sbd = data.sbd;
    this.toan = data.toan;
    this.ngu_van = data.ngu_van;
    this.ngoai_ngu = data.ngoai_ngu;
    this.vat_li = data.vat_li;
    this.hoa_hoc = data.hoa_hoc;
    this.sinh_hoc = data.sinh_hoc;
    this.lich_su = data.lich_su;
    this.dia_li = data.dia_li;
    this.gdcd = data.gdcd;
    this.ma_ngoai_ngu = data.ma_ngoai_ngu;
  }

  // Tính tổng điểm khối A (Toán, Lý, Hóa)
  getTongDiemKhoiA(): number | null {
    if (this.toan === null || this.vat_li === null || this.hoa_hoc === null) {
      return null;
    }
    return this.toan + this.vat_li + this.hoa_hoc;
  }

  // Tính điểm trung bình tất cả các môn đã thi
  getDiemTrungBinh(): number | null {
    const scores = [
      this.toan,
      this.ngu_van,
      this.ngoai_ngu,
      this.vat_li,
      this.hoa_hoc,
      this.sinh_hoc,
      this.lich_su,
      this.dia_li,
      this.gdcd,
    ].filter((score): score is number => score !== null);

    if (scores.length === 0) {
      return null;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round((total / scores.length) * 100) / 100;
  }

  // Chuyển đổi thành object thuần
  toJSON(): IBangDiem {
    return {
      id: this.id,
      sbd: this.sbd,
      toan: this.toan,
      ngu_van: this.ngu_van,
      ngoai_ngu: this.ngoai_ngu,
      vat_li: this.vat_li,
      hoa_hoc: this.hoa_hoc,
      sinh_hoc: this.sinh_hoc,
      lich_su: this.lich_su,
      dia_li: this.dia_li,
      gdcd: this.gdcd,
      ma_ngoai_ngu: this.ma_ngoai_ngu,
    };
  }

  // ==================== STATIC METHODS (Repository Pattern) ====================

  // Tìm theo ID
  static async findById(id: number): Promise<BangDiem | null> {
    const record = await prisma.bangDiem.findUnique({
      where: { id },
    });
    return record ? new BangDiem(record) : null;
  }

  // Tìm theo số báo danh
  static async findBySbd(sbd: string): Promise<BangDiem | null> {
    const record = await prisma.bangDiem.findUnique({
      where: { sbd },
    });
    return record ? new BangDiem(record) : null;
  }

  // Lấy tất cả bản ghi
  static async findAll(options?: {
    skip?: number;
    take?: number;
  }): Promise<BangDiem[]> {
    const records = await prisma.bangDiem.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { sbd: "asc" },
    });
    return records.map((record: any) => new BangDiem(record));
  }

  // Tạo mới một bản ghi
  static async create(data: ICreateBangDiem): Promise<BangDiem> {
    const record = await prisma.bangDiem.create({
      data: {
        sbd: data.sbd,
        toan: data.toan ?? null,
        ngu_van: data.ngu_van ?? null,
        ngoai_ngu: data.ngoai_ngu ?? null,
        vat_li: data.vat_li ?? null,
        hoa_hoc: data.hoa_hoc ?? null,
        sinh_hoc: data.sinh_hoc ?? null,
        lich_su: data.lich_su ?? null,
        dia_li: data.dia_li ?? null,
        gdcd: data.gdcd ?? null,
        ma_ngoai_ngu: data.ma_ngoai_ngu ?? null,
      },
    });
    return new BangDiem(record);
  }

  // Tạo nhiều bản ghi cùng lúc
  static async createMany(
    dataList: ICreateBangDiem[],
    skipDuplicates: boolean = true
  ): Promise<number> {
    const result = await prisma.bangDiem.createMany({
      data: dataList.map((data) => ({
        sbd: data.sbd,
        toan: data.toan ?? null,
        ngu_van: data.ngu_van ?? null,
        ngoai_ngu: data.ngoai_ngu ?? null,
        vat_li: data.vat_li ?? null,
        hoa_hoc: data.hoa_hoc ?? null,
        sinh_hoc: data.sinh_hoc ?? null,
        lich_su: data.lich_su ?? null,
        dia_li: data.dia_li ?? null,
        gdcd: data.gdcd ?? null,
        ma_ngoai_ngu: data.ma_ngoai_ngu ?? null,
      })),
      skipDuplicates,
    });
    return result.count;
  }

  // Cập nhật một bản ghi
  static async update(
    id: number,
    data: Partial<ICreateBangDiem>
  ): Promise<BangDiem | null> {
    try {
      const record = await prisma.bangDiem.update({
        where: { id },
        data,
      });
      return new BangDiem(record);
    } catch {
      return null;
    }
  }

  // Xóa một bản ghi
  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.bangDiem.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Xóa tất cả bản ghi
  static async deleteAll(): Promise<number> {
    const result = await prisma.bangDiem.deleteMany();
    return result.count;
  }

  // Đếm tổng số bản ghi
  static async count(): Promise<number> {
    return await prisma.bangDiem.count();
  }

  // Tìm kiếm với điều kiện
  static async findWhere(conditions: {
    toan_gte?: number;
    toan_lte?: number;
    ngu_van_gte?: number;
    ngu_van_lte?: number;
    ma_ngoai_ngu?: string;
  }): Promise<BangDiem[]> {
    const where: any = {};

    if (conditions.toan_gte !== undefined || conditions.toan_lte !== undefined) {
      where.toan = {};
      if (conditions.toan_gte !== undefined) where.toan.gte = conditions.toan_gte;
      if (conditions.toan_lte !== undefined) where.toan.lte = conditions.toan_lte;
    }

    if (conditions.ngu_van_gte !== undefined || conditions.ngu_van_lte !== undefined) {
      where.ngu_van = {};
      if (conditions.ngu_van_gte !== undefined) where.ngu_van.gte = conditions.ngu_van_gte;
      if (conditions.ngu_van_lte !== undefined) where.ngu_van.lte = conditions.ngu_van_lte;
    }

    if (conditions.ma_ngoai_ngu !== undefined) {
      where.ma_ngoai_ngu = conditions.ma_ngoai_ngu;
    }

    const records = await prisma.bangDiem.findMany({ where });
    return records.map((record: any) => new BangDiem(record));
  }
}

export default BangDiem;
