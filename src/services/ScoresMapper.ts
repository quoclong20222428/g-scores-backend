import BangDiem from "../model/BangDiem";

/**
 * Class chịu trách nhiệm chuyển đổi BangDiem entity thành các định dạng khác nhau
 * (Mapper Pattern - Single Responsibility)
 */
export class ScoresMapper {
  /**
   * Chuyển đổi BangDiem entity thành response object đơn giản
   */
  toSimpleResponse(item: BangDiem) {
    return item.toJSON();
  }

  /**
   * Chuyển đổi BangDiem entity thành response object kèm tổng điểm các khối
   */
  toDetailedResponse(item: BangDiem) {
    return {
      ...item.toJSON(),
      tongDiemKhoiA: item.getTongDiemKhoiA(),
      tongDiemKhoiB: item.getTongDiemKhoiB(),
      tongDiemKhoiC: item.getTongDiemKhoiC(),
      tongDiemKhoiD: item.getTongDiemKhoiD(),
      diemTrungBinh: item.getDiemTrungBinh(),
    };
  }

  /**
   * Chuyển đổi danh sách BangDiem entities
   */
  toSimpleList(items: BangDiem[]) {
    return items.map((item) => this.toSimpleResponse(item));
  }

  /**
   * Chuyển đổi danh sách BangDiem entities kèm chi tiết
   */
  toDetailedList(items: BangDiem[]) {
    return items.map((item) => this.toDetailedResponse(item));
  }
}

export default ScoresMapper;
