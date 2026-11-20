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

// mongol_tsegtslal.md-ийн машинаар шалгаж болох дүрмүүд.
// Кодын зэрэгцүүлэлт тоологдохгүйн тулд эх кодыг биш, өгөгдлийн текстийг шалгана.
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "docs-data.js"), "utf8"), ctx);

// Объект доторх бүх текстийг байршлынх нь хамт цуглуулна
function texts(obj, where, out = []) {
  if (typeof obj === "string") out.push([where, obj]);
  else if (obj && typeof obj === "object")
    Object.entries(obj).forEach(([k, v]) => texts(v, where + "." + k, out));
  return out;
}
const ALL = texts({ COURSE, SEMINARS, LAWS, MNS: ctx.window.MNS }, "");

// Дүрэм зөрчсөн текстүүдийг "байршил: хэсэг" хэлбэрээр буцаана
function broken(re) {
  return ALL.filter(([, s]) => re.test(s)).map(([w, s]) => w + ": " + s.match(re)[0]);
}

test("Цэг таслал: давхар зай байхгүй", () => {
  assert.deepEqual(broken(/\S {2,}\S/), []);
});

// "( )" нь хаалт тэмдгийг өөрийг нь нэрлэсэн тул тооцохгүй
test("Цэг таслал: хаалтын дотор талд зай байхгүй", () => {
  assert.deepEqual(broken(/.{0,10}(\( (?!\))|(?<!\() \)).{0,10}/), []);
});

test("Цэг таслал: . , ? ! : ; тэмдгийн өмнө зай байхгүй", () => {
  assert.deepEqual(broken(/.{0,10}\S [.,?!:;](\s|$).{0,10}/), []);
});

// Маягтын бөглөх зай (" .. ", "А/..") тооцохгүй, үгийн араас ".." орсныг л шалгана
test("Цэг таслал: давхар цэг байхгүй", () => {
  assert.deepEqual(broken(/.{0,10}[^\s\/.]\.\.(\s|$).{0,10}/), []);
});

test("Цэг таслал: нээсэн хашилт бүр хаагдсан", () => {
  const odd = ALL.filter(([, s]) => (s.match(/"/g) || []).length % 2 === 1);
  assert.deepEqual(odd.map(([w]) => w), []);
});
