export default class ListResult {
  constructor(ids, total, perPage) {
    this.ids = ids;
    this.total = total || ids.length;
    this.perPage = perPage || this.total;
  }

  static isListResult(object) {
    return (
      object.total !== undefined &&
      object.perPage !== undefined &&
      Array.isArray(object.ids)
    );
  }
}
