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

  // Tính tổng điểm khối B (Toán, Hóa, Sinh)
  getTongDiemKhoiB(): number | null {
    if (this.toan === null || this.hoa_hoc === null || this.sinh_hoc === null) {
      return null;
    }
    return this.toan + this.hoa_hoc + this.sinh_hoc;
  }

  // Tính tổng điểm khối C (Văn, Sử, Địa)
  getTongDiemKhoiC(): number | null {
    if (this.ngu_van === null || this.lich_su === null || this.dia_li === null) {
      return null;
    }
    return this.ngu_van + this.lich_su + this.dia_li;
  }

  // Tính tổng điểm khối D (Toán, Văn, Ngoại ngữ)
  getTongDiemKhoiD(): number | null {
    if (this.toan === null || this.ngu_van === null || this.ngoai_ngu === null) {
      return null;
    }
    return this.toan + this.ngu_van + this.ngoai_ngu;
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
}

export default BangDiem;
