import { PrismaClient } from "@prisma/client";
import BangDiem, { ICreateBangDiem } from "../model/BangDiem";

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
    return records.map((record) => new BangDiem(record));
  }

  async count(): Promise<number> {
    return await this.prisma.bangDiem.count();
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
    return records.map((record) => new BangDiem(record));
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default BangDiemRepository;
