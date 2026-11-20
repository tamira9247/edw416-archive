// Feature №8: progress.js-ийн дүрмүүдийг шалгана. Ажиллуулах: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const P = require("../progress.js");

const ctx = { window: {} };
["lectures.js", "seminars.js"].forEach((f) =>
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx));
const { COURSE, SEMINARS } = ctx.window;

// localStorage-ийн оронд хэрэглэх энгийн сан
function memory(initial) {
  const data = Object.assign({}, initial);
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const broken = { getItem: () => { throw new Error("хаалттай"); }, setItem: () => { throw new Error("хаалттай"); } };

test("1. Хоосон storage-д хоосон явц гарна", () => {
  assert.deepEqual(P.load(memory()), { lectures: [], seminars: [] });
});

test("2. Эвдэрсэн өгөгдөлд хоосон явц гарна", () => {
  assert.deepEqual(P.load(memory({ [P.KEY]: "{эвдэрсэн" })), { lectures: [], seminars: [] });
  assert.deepEqual(P.load(memory({ [P.KEY]: '{"lectures":"x","seminars":[1,"a"]}' })),
    { lectures: [], seminars: [1] });
});

test("3. Storage ажиллахгүй бол алдаагүй үргэлжилнэ", () => {
  assert.deepEqual(P.load(broken), { lectures: [], seminars: [] });
  assert.equal(P.save(broken, P.empty()), false);
});

test("4. Хадгалсан явц дахин уншихад ижил гарна", () => {
  const s = memory();
  const p = P.toggle(P.toggle(P.empty(), "lectures", 3), "seminars", 5);
  assert.equal(P.save(s, p), true);
  assert.deepEqual(P.load(s), p);
});

test("5. Хоёр удаа тэмдэглэхэд анхны төлөвтөө орно", () => {
  const p = P.toggle(P.toggle(P.empty(), "lectures", 2), "lectures", 2);
  assert.deepEqual(p, P.empty());
});

test("6. Юу ч уншаагүй бол 0/24, 0%", () => {
  const s = P.summary(P.empty(), COURSE, SEMINARS);
  assert.equal(s.done, 0);
  assert.equal(s.total, 24);
  assert.equal(s.percent, 0);
  assert.deepEqual(Array.from(s.chapters, (c) => c.total), [6, 9, 9]);
});

test("7. 1-р лекц, түүний 2 семинарыг уншвал 1-р бүлэгт 3, нийт 3 тоологдоно", () => {
  let p = P.toggle(P.empty(), "lectures", 1);
  SEMINARS.filter((x) => x.lecture === 1).forEach((x) => { p = P.toggle(p, "seminars", x.id); });
  const s = P.summary(p, COURSE, SEMINARS);
  assert.equal(s.done, 3);
  assert.deepEqual(Array.from(s.chapters, (c) => c.done), [3, 0, 0]);
  assert.equal(s.percent, 13);
});
