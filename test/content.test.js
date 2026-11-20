// lectures.js, seminars.js, laws.js-ийн бүрэн бүтэн байдлыг шалгана. Ажиллуулах: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ctx = { window: {} };
["lectures.js", "seminars.js", "laws.js"].forEach((f) =>
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx));
const { COURSE, SEMINARS, LAWS } = ctx.window;
const lawIds = new Set(LAWS.items.map((l) => l.id));

test("8 лекц, дугаар 1–8, 3 бүлэгт хамаарна", () => {
  assert.equal(COURSE.lectures.length, 8);
  COURSE.lectures.forEach((l, i) => {
    assert.equal(l.id, i + 1);
    assert.ok(COURSE.chapters.some((c) => c.id === l.chapter));
  });
});

test("Лекц бүр зорилго, гол ойлголт, агуулга, эрх зүйн акттай", () => {
  COURSE.lectures.forEach((l) => {
    assert.ok(l.goal.length > 0, "зорилго: " + l.id);
    assert.ok(l.concepts.length > 0, "ойлголт: " + l.id);
    assert.ok(l.sections.length > 0, "агуулга: " + l.id);
    l.sections.forEach((s) => s.blocks.forEach((b) =>
      assert.ok(b.p || b.ul || b.ol || b.table || b.note, "блок: " + l.id)));
    l.laws.forEach((id) => assert.ok(lawIds.has(id), "акт олдсонгүй: " + id));
  });
});

test("16 семинар, лекц бүрт 2 семинар", () => {
  assert.equal(SEMINARS.length, 16);
  for (let i = 1; i <= 8; i++) assert.equal(SEMINARS.filter((s) => s.lecture === i).length, 2);
  SEMINARS.forEach((s) => s.laws.forEach((id) => assert.ok(lawIds.has(id), "акт олдсонгүй: " + id)));
});

test("Эрх зүйн акт бүр бүлэг, статустай; холбоос эсвэл хайх үгтэй", () => {
  const groups = new Set(LAWS.groups.map((g) => g.id));
  LAWS.items.forEach((l) => {
    assert.ok(groups.has(l.group), l.id);
    assert.ok(["хүчинтэй", "шалгах", "хүчингүй"].includes(l.status), l.id);
    assert.ok(l.url || l.search || l.status === "хүчингүй", "холбоосгүй: " + l.id);
  });
});

test("Текстэд «» хашилт байхгүй", () => {
  ["lectures.js", "seminars.js", "laws.js"].forEach((f) => {
    const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    assert.ok(!/[«»]/.test(src), f);
  });
});
