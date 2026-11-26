(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KataAuctionDataNormalizer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var FIELD_LIMITS = {
    auction: { scsbd_prc: 100000000, qty: 10000000, unit_qty: 1000000 },
    settlement: { lwprc: 100000000, hgprc: 100000000, avgprc: 100000000, unit_tot_qty: 1000000000 },
  };
  function parsePositiveNumber(value, max) {
    if (value === null || value === undefined) return null;
    var text = String(value).replace(/,/g, "").trim();
    if (!text || text === "-" || !/^\d+(?:\.\d+)?$/.test(text)) return null;
    var number = Number(text);
    return Number.isFinite(number) && number > 0 && number <= max ? number : null;
  }
  function percentile(sorted, ratio) {
    if (!sorted.length) return null;
    var index = (sorted.length - 1) * ratio, lower = Math.floor(index), upper = Math.ceil(index);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }
  function calculateUpperFence(values) {
    if (values.length < 8) return Infinity;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var q1 = percentile(sorted, 0.25), q3 = percentile(sorted, 0.75), median = percentile(sorted, 0.5);
    return Math.max(q3 + Math.max((q3 - q1) * 6, q3 * 2), median * 20);
  }
  function normalizeAuctionRecords(records, type) {
    var kind = type === "settlement" ? "settlement" : "auction";
    var limits = FIELD_LIMITS[kind], fields = Object.keys(limits);
    var normalized = (Array.isArray(records) ? records : []).map(function (record) {
      var copy = Object.assign({}, record);
      fields.forEach(function (field) { copy[field] = parsePositiveNumber(record && record[field], limits[field]); });
      return copy;
    });
    var fences = {};
    fields.forEach(function (field) {
      fences[field] = calculateUpperFence(normalized.map(function (record) { return record[field]; }).filter(function (value) { return value !== null; }));
    });
    normalized = normalized.filter(function (record) {
      return fields.every(function (field) { return record[field] === null || record[field] <= fences[field]; });
    });
    if (kind === "auction") return normalized.filter(function (record) { return record.scsbd_prc !== null && record.qty !== null; });
    return normalized.filter(function (record) {
      if (record.avgprc === null || record.unit_tot_qty === null) return false;
      if (record.lwprc !== null && record.hgprc !== null && record.lwprc > record.hgprc) return false;
      if (record.lwprc !== null && record.avgprc < record.lwprc) return false;
      if (record.hgprc !== null && record.avgprc > record.hgprc) return false;
      return true;
    });
  }
  return { normalizeAuctionRecords: normalizeAuctionRecords, parsePositiveNumber: parsePositiveNumber };
});
