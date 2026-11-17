// Feature №3: docs-data.js (31 баримт бичгийн лавлах) бүрэн бүтэн эсэхийг шалгана. Ажиллуулах: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// docs-data.js-ийг хөтөч дээрх шиг ачаалж window.MNS-ийг авна
const SRC = fs.readFileSync(path.join(__dirname, "..", "docs-data.js"), "utf8");
const win = {};
vm.runInNewContext(SRC, { window: win });
const M = win.MNS;

// "01/02" хэлбэрийн кодыг салгана
function codes(list) {
  return list.flatMap((c) => c.split("/"));
}

test("3 төрөл, 31 баримт, 28 бүрдэл байна", () => {
  assert.equal(M.groups.length, 3);
  assert.equal(M.docs.length, 31);
  assert.equal(Object.keys(M.components).length, 28);
});

test("баримтын id давхардахгүй", () => {
  const ids = M.docs.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("баримт бүр байгаа төрөлд хамаарч, тодорхойлолт, заалттай", () => {
  const groupIds = M.groups.map((g) => g.id);
  for (const d of M.docs) {
    assert.ok(groupIds.includes(d.group), d.id + ": төрөл " + d.group);
    assert.ok(d.name && d.def && d.clause, d.id + ": нэр/тодорхойлолт/заалт хоосон");
  }
});

test("баримтын бүрдлийн код бүр 28 бүрдэлд байна", () => {
  for (const d of M.docs) {
    for (const c of codes(d.paper).concat(codes(d.digital))) {
      assert.ok(M.components[c], d.id + ": үл мэдэгдэх бүрдэл " + c);
    }
  }
});

test("төрөл бүрт бичих алхам, шалгах хуудас байна", () => {
  for (const g of M.groups) {
    const w = M.groupWriting[g.id];
    assert.ok(w && w.steps.length > 0 && w.check.length > 0, g.id);
  }
});

test("өгөгдөлд франц хашилт (U+00AB, U+00BB) байхгүй", () => {
  assert.equal(/[\u00AB\u00BB]/.test(SRC), false);
});
