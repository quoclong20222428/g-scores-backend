import { PrismaClient } from "@prisma/client";
import BangDiem, { ICreateBangDiem } from "../model/BangDiem";

type PrismaBangDiem = any; // Prisma model type

const prisma = new PrismaClient();

export class BangDiemRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  async findBySbd(sbd: string): Promise<BangDiem | null> {
    const record = await this.prisma.bangDiem.findUnique({
      where: { sbd },
    });
    return record ? new BangDiem(record) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
  }): Promise<BangDiem[]> {
    const records = await this.prisma.bangDiem.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { sbd: "asc" },
    });
    return records.map((record: PrismaBangDiem) => new BangDiem(record));
  }

  async count(): Promise<number> {
    return await this.prisma.bangDiem.count();
  }

  // Tạo nhiều bản ghi cùng lúc
  async createMany(
    dataList: ICreateBangDiem[],
    skipDuplicates: boolean = true
  ): Promise<number> {
    const result = await this.prisma.bangDiem.createMany({
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

  // Xóa tất cả bản ghi
  async deleteAll(): Promise<number> {
    const result = await this.prisma.bangDiem.deleteMany();
    return result.count;
  }

  async findWhere(conditions: {
    toan_gte?: number;
    toan_lte?: number;
    ngu_van_gte?: number;
    ngu_van_lte?: number;
    ma_ngoai_ngu?: string;
  }): Promise<BangDiem[]> {
    const where: any = {};

    if (conditions.toan_gte !== undefined || conditions.toan_lte !== undefined) {
      where.toan = {};
      if (conditions.toan_gte !== undefined)
        where.toan.gte = conditions.toan_gte;
      if (conditions.toan_lte !== undefined)
        where.toan.lte = conditions.toan_lte;
    }

    if (
      conditions.ngu_van_gte !== undefined ||
      conditions.ngu_van_lte !== undefined
    ) {
      where.ngu_van = {};
      if (conditions.ngu_van_gte !== undefined)
        where.ngu_van.gte = conditions.ngu_van_gte;
      if (conditions.ngu_van_lte !== undefined)
        where.ngu_van.lte = conditions.ngu_van_lte;
    }

    if (conditions.ma_ngoai_ngu !== undefined) {
      where.ma_ngoai_ngu = conditions.ma_ngoai_ngu;
    }

    const records = await this.prisma.bangDiem.findMany({ where });
    return records.map((record: PrismaBangDiem) => new BangDiem(record));
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default BangDiemRepository;
