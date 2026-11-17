// Хийгдсэн feature-үүдийн (№1, №2) дүрмийн тестүүд. Ажиллуулах: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const Logic = require("../logic.js");

// data.js-ийг хөтөч дээрх шиг ачаалж DATA-г авна
const DATA = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8") + "\n;DATA"
);
const topics = DATA.topics.slice().sort((a, b) => a.id - b.id);

function emptyTopic(id) {
  return { id: id, chapter: 1, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] };
}

// 3 алдаатай туршилтын дасгал (хэсгийн индекс: 1, 3, 5 нь алдаа)
function sampleExercise() {
  return {
    id: 1,
    type: "Албан бичиг",
    title: "Тест",
    parts: [
      { text: "Эхлэл " },
      { text: "алдаа1", error: { correct: "зөв1", explanation: "" } },
      { text: " дунд " },
      { text: "алдаа2", error: { correct: "зөв2", explanation: "" } },
      { text: " бас " },
      { text: "алдаа3", error: { correct: "зөв3", explanation: "" } },
      { text: " төгсгөл" },
    ],
  };
}

// ---------- Feature №1: агуулга ----------

test("1. Бүх талбар хоосон сэдэвт \"Удахгүй нэмэгдэнэ\" гарна", () => {
  assert.equal(Logic.hasContent(emptyTopic(1)), false);
  assert.equal(Logic.EMPTY_MESSAGE, "Удахгүй нэмэгдэнэ");
});

test("2. Ганц талбар бөглөгдсөн ч агуулгатай гэж тооцогдоно", () => {
  const t = emptyTopic(1);
  t.goal = "Зорилго";
  assert.equal(Logic.hasContent(t), true);

  const t2 = emptyTopic(2);
  t2.references = [{ title: "MNS 5140:2026" }];
  assert.equal(Logic.hasContent(t2), true);

  const t3 = emptyTopic(3);
  t3.lecture = "   "; // зөвхөн хоосон зай агуулга биш
  assert.equal(Logic.hasContent(t3), false);
});

test("3. Эхний сэдэв дээр \"Өмнөх\" идэвхгүй", () => {
  assert.equal(Logic.pagerState(0, 16).prevDisabled, true);
  assert.equal(Logic.pagerState(0, 16).nextDisabled, false);
});

test("4. Сүүлийн сэдэв дээр \"Дараах\" идэвхгүй", () => {
  assert.equal(Logic.pagerState(15, 16).nextDisabled, true);
  assert.equal(Logic.pagerState(15, 16).prevDisabled, false);
});

test("5. Дунд сэдэв дээр хоёр товч идэвхтэй", () => {
  assert.deepEqual(Logic.pagerState(7, 16), { prevDisabled: false, nextDisabled: false });
});

test("6. Нэргүй сэдэв \"Сэдэв N\" гэж харагдана", () => {
  assert.equal(Logic.topicTitle(emptyTopic(7)), "Сэдэв 7");
  assert.equal(Logic.topicTitle({ id: 7, title: "   " }), "Сэдэв 7");
  assert.equal(Logic.topicTitle({ id: 7, title: "Архивын хууль" }), "Архивын хууль");
});

test("7. CLO хоосон сэдэвт бүлгийн CLO харагдана", () => {
  const chapter = { id: 1, clo: [1, 2, 5] };
  assert.deepEqual(Logic.topicClo(emptyTopic(1), chapter), [1, 2, 5]);
  const t = emptyTopic(1);
  t.clo = [2];
  assert.deepEqual(Logic.topicClo(t, chapter), [2]);
});

test("8. 2-р бүлэгт зөвхөн 5–10-р сэдэв гарна", () => {
  const ids = Logic.topicIndexesInChapter(topics, 2).map((i) => topics[i].id);
  assert.deepEqual(ids, [5, 6, 7, 8, 9, 10]);
});

test("9. #sedev-5 нь 5-р сэдвийг, буруу хаяг 1-р сэдвийг нээнэ", () => {
  assert.equal(topics[Logic.indexFromHash("#sedev-5", topics)].id, 5);
  assert.equal(Logic.indexFromHash("#sedev-99", topics), 0);
  assert.equal(Logic.indexFromHash("#busad", topics), 0);
  assert.equal(Logic.indexFromHash("", topics), 0);
});

// ---------- Feature №2: алдаа олж засах дасгал ----------

test("10. Алдаа дарахад олсон тоо 1-ээр нэмэгдэнэ", () => {
  const s = Logic.createExercise(sampleExercise());
  assert.equal(s.total, 3);
  const r = Logic.clickError(s, 1);
  assert.equal(r.counted, true);
  assert.equal(s.found.size, 1);
  assert.equal(Logic.statusText(s), "Олсон 1 / 3 · Буруу дарсан: 0");
});

test("11. Нэг алдааг 2 дахин дарахад давхар тоологдохгүй", () => {
  const s = Logic.createExercise(sampleExercise());
  Logic.clickError(s, 1);
  const r = Logic.clickError(s, 1);
  assert.equal(r.counted, false);
  assert.equal(r.found, true);
  assert.equal(s.found.size, 1);
});

test("12. Алдаагүй хэсэгт \"Энд алдаа байхгүй\" гарч, буруу даралт нэмэгдэнэ", () => {
  const s = Logic.createExercise(sampleExercise());
  const r = Logic.clickPlain(s);
  assert.equal(r.message, "Энд алдаа байхгүй");
  assert.equal(s.wrong, 1);
  assert.equal(s.found.size, 0);
});

test("13. Бүх алдааг олбол автоматаар дуусна", () => {
  const s = Logic.createExercise(sampleExercise());
  Logic.clickError(s, 1);
  Logic.clickError(s, 3);
  assert.equal(Logic.isComplete(s), false);
  Logic.clickError(s, 5);
  assert.equal(Logic.isComplete(s), true);
  assert.deepEqual(Logic.finishExercise(s), []);
  assert.equal(Logic.isComplete(s), false); // дахин дуусгахгүй
});

test("14. Дутуу дуусгахад олоогүй алдаанууд гарна", () => {
  const s = Logic.createExercise(sampleExercise());
  Logic.clickError(s, 3);
  assert.deepEqual(Logic.finishExercise(s), [1, 5]);
  assert.equal(Logic.statusText(s), "Дууссан: олсон 1 / 3, олоогүй 2, буруу дарсан 0");
  assert.equal(Logic.finishExercise(s), null); // 2 дахь удаа юу ч хийхгүй
});

test("15. Дууссаны дараах даралт тоологдохгүй", () => {
  const s = Logic.createExercise(sampleExercise());
  Logic.finishExercise(s);
  assert.equal(Logic.clickError(s, 1).counted, false);
  assert.equal(Logic.clickError(s, 1).found, false);
  assert.equal(Logic.clickPlain(s).counted, false);
  assert.equal(s.found.size, 0);
  assert.equal(s.wrong, 0);
});

test("16. \"Дахин эхлэх\" дарахад тоолуур тэглэгдэнэ", () => {
  const exercise = sampleExercise();
  const s = Logic.createExercise(exercise);
  Logic.clickError(s, 1);
  Logic.clickPlain(s);
  Logic.finishExercise(s);
  const fresh = Logic.createExercise(exercise);
  assert.equal(fresh.found.size, 0);
  assert.equal(fresh.wrong, 0);
  assert.equal(fresh.finished, false);
});

test("17. Дасгал байхгүй бол \"Удахгүй нэмэгдэнэ\" гарна", () => {
  assert.equal(Logic.exercisePlaceholder(Logic.listExercises({})), "Удахгүй нэмэгдэнэ");
  assert.equal(Logic.exercisePlaceholder(Logic.listExercises({ exercises: [] })), "Удахгүй нэмэгдэнэ");
  assert.equal(
    Logic.exercisePlaceholder(Logic.listExercises(DATA)),
    "Зүүн талаас баримтын жишээ сонгоно уу."
  );
});
