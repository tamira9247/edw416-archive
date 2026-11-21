// Feature №6: auth.js-ийн цэвэр функцуудыг шалгана. Ажиллуулах: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../auth.js");

test("дугаар: 8 оронтой дугаарыг хүлээн авна", () => {
  assert.equal(A.phone("99000001"), "99000001");
});

test("дугаар: зай, зураас, хаалтыг хасна", () => {
  assert.equal(A.phone(" 9900 0001 "), "99000001");
  assert.equal(A.phone("9900-0001"), "99000001");
  assert.equal(A.phone("(9900) 0001"), "99000001");
});

test("дугаар: +976, 976 угтварыг хасна", () => {
  assert.equal(A.phone("+976 9900 0001"), "99000001");
  assert.equal(A.phone("97699000001"), "99000001");
});

test("дугаар: 8 оронгүй, үсэгтэй, хоосон бол null", () => {
  ["", "1234567", "123456789", "9900000a", "+1 99000001", null, undefined].forEach((x) =>
    assert.equal(A.phone(x), null, String(x)));
});

test("алдааны мессеж: функцийн алдааны код бүрд тохирох мессеж", () => {
  assert.match(A.errorText("bad_phone"), /8 оронтой/);
  assert.match(A.errorText("too_many"), /Хэт олон/);
  assert.match(A.errorText("EXPIRED"), /Хугацаа дууслаа/);
  assert.match(A.errorText("local_test_only"), /тест дугаар/);
  ["verify_failed", "server", "network", undefined].forEach((c) =>
    assert.match(A.errorText(c), /Алдаа гарлаа/, String(c)));
});

test("үлдсэн хугацаа: м:сс хэлбэр, дууссан бол 0:00", () => {
  const now = Date.parse("2026-11-21T10:00:00Z");
  assert.equal(A.remaining("2026-11-21T10:02:00Z", now), "2:00");
  assert.equal(A.remaining("2026-11-21T10:01:05Z", now), "1:05");
  assert.equal(A.remaining("2026-11-21T10:00:00.400Z", now), "0:01");
  assert.equal(A.remaining("2026-11-21T09:59:00Z", now), "0:00");
});
