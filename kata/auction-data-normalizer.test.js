const assert = require("node:assert/strict");
const { normalizeAuctionRecords } = require("./auction-data-normalizer.js");
const auction = normalizeAuctionRecords([
  { scsbd_prc: "12,000", qty: "20", unit_qty: "10" },
  { scsbd_prc: "", qty: "20", unit_qty: "10" },
  { scsbd_prc: "999999999", qty: "20", unit_qty: "10" },
  { scsbd_prc: "12000", qty: "NaN", unit_qty: "10" },
], "auction");
assert.deepEqual(auction, [{ scsbd_prc: 12000, qty: 20, unit_qty: 10 }]);
const settlement = normalizeAuctionRecords([
  { lwprc: "1000", avgprc: "2000", hgprc: "3000", unit_tot_qty: "50" },
  { lwprc: "3000", avgprc: "2000", hgprc: "1000", unit_tot_qty: "50" },
  { lwprc: "1000", avgprc: "", hgprc: "3000", unit_tot_qty: "50" },
], "settlement");
assert.deepEqual(settlement, [{ lwprc: 1000, avgprc: 2000, hgprc: 3000, unit_tot_qty: 50 }]);

const outliers = normalizeAuctionRecords([
  ...Array.from({ length: 10 }, (_, index) => ({
    scsbd_prc: String(10000 + index * 100), qty: "10", unit_qty: "1",
  })),
  { scsbd_prc: "5000000", qty: "10", unit_qty: "1" },
], "auction");
assert.equal(outliers.length, 10);
assert.equal(outliers.some((record) => record.scsbd_prc === 5000000), false);
console.log("auction-data-normalizer tests passed");
