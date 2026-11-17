// Дэлгэцээс хамааралгүй дүрмүүд (тестлэх боломжтой цэвэр функцууд).
// Хөтөч дээр window.Logic, Node дээр require("./logic.js") гэж ашиглана.
(function () {
  "use strict";

  const EMPTY_MESSAGE = "Удахгүй нэмэгдэнэ";
  const NO_ERROR_MESSAGE = "Энд алдаа байхгүй";
  const PICK_EXERCISE_MESSAGE = "Зүүн талаас баримтын жишээ сонгоно уу.";
  const CONTENT_FIELDS = ["goal", "concepts", "lecture", "seminar", "references"];

  // ---------- Feature №1: агуулга ----------

  function filled(value) {
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim() !== "";
  }

  // Бүх талбар хоосон бол false: "Удахгүй нэмэгдэнэ" харуулна
  function hasContent(topic) {
    return CONTENT_FIELDS.some((k) => filled(topic[k]));
  }

  function topicTitle(topic) {
    return topic.title && topic.title.trim() ? topic.title : "Сэдэв " + topic.id;
  }

  // Сэдвийн CLO хоосон бол бүлгийн CLO
  function topicClo(topic, chapter) {
    return filled(topic.clo) ? topic.clo : chapter.clo;
  }

  // Эхний сэдэвт "Өмнөх", сүүлийн сэдэвт "Дараах" идэвхгүй
  function pagerState(index, length) {
    return { prevDisabled: index === 0, nextDisabled: index === length - 1 };
  }

  // Тухайн бүлгийн сэдвүүдийн индексүүд (topics массив дахь)
  function topicIndexesInChapter(topics, chapterId) {
    const result = [];
    topics.forEach((t, i) => {
      if (t.chapter === chapterId) result.push(i);
    });
    return result;
  }

  // "#sedev-5" → 5-р сэдвийн индекс; таарахгүй бол 0 (эхний сэдэв)
  function indexFromHash(hash, topics) {
    const m = String(hash || "").match(/^#sedev-(\d+)$/);
    if (!m) return 0;
    const i = topics.findIndex((t) => t.id === Number(m[1]));
    return i === -1 ? 0 : i;
  }

  // ---------- Feature №2: алдаа олж засах дасгал ----------

  function listExercises(data) {
    return data && Array.isArray(data.exercises) ? data.exercises : [];
  }

  // Дасгал байхгүй бол "Удахгүй нэмэгдэнэ", байвал сонгохыг сануулна
  function exercisePlaceholder(exercises) {
    return exercises.length === 0 ? EMPTY_MESSAGE : PICK_EXERCISE_MESSAGE;
  }

  // Шинэ эсвэл "Дахин эхлэх" үеийн төлөв
  function createExercise(exercise) {
    return {
      exercise: exercise,
      total: exercise.parts.filter((p) => p.error).length,
      found: new Set(),
      wrong: 0,
      finished: false,
    };
  }

  // Алдаатай хэсэг дарах. counted: энэ даралтаар шинээр олсон эсэх
  function clickError(state, partIndex) {
    let counted = false;
    if (!state.finished && !state.found.has(partIndex)) {
      state.found.add(partIndex);
      counted = true;
    }
    return { counted: counted, found: state.found.has(partIndex) };
  }

  // Алдаагүй хэсэг дарах. Дууссаны дараа тоологдохгүй
  function clickPlain(state) {
    let counted = false;
    if (!state.finished) {
      state.wrong += 1;
      counted = true;
    }
    return { counted: counted, message: NO_ERROR_MESSAGE };
  }

  // Бүх алдааг олсон бол автоматаар дуусгана
  function isComplete(state) {
    return !state.finished && state.found.size === state.total;
  }

  // Дуусгах. Олоогүй алдаануудын индексийг буцаана; аль хэдийн дууссан бол null
  function finishExercise(state) {
    if (state.finished) return null;
    state.finished = true;
    const missed = [];
    state.exercise.parts.forEach((part, pi) => {
      if (part.error && !state.found.has(pi)) missed.push(pi);
    });
    return missed;
  }

  function statusText(state) {
    if (state.finished) {
      const missed = state.total - state.found.size;
      return "Дууссан: олсон " + state.found.size + " / " + state.total +
        ", олоогүй " + missed + ", буруу дарсан " + state.wrong;
    }
    return "Олсон " + state.found.size + " / " + state.total + " · Буруу дарсан: " + state.wrong;
  }

  const Logic = {
    EMPTY_MESSAGE: EMPTY_MESSAGE,
    NO_ERROR_MESSAGE: NO_ERROR_MESSAGE,
    PICK_EXERCISE_MESSAGE: PICK_EXERCISE_MESSAGE,
    filled: filled,
    hasContent: hasContent,
    topicTitle: topicTitle,
    topicClo: topicClo,
    pagerState: pagerState,
    topicIndexesInChapter: topicIndexesInChapter,
    indexFromHash: indexFromHash,
    listExercises: listExercises,
    exercisePlaceholder: exercisePlaceholder,
    createExercise: createExercise,
    clickError: clickError,
    clickPlain: clickPlain,
    isComplete: isComplete,
    finishExercise: finishExercise,
    statusText: statusText,
  };

  if (typeof module === "object" && module.exports) module.exports = Logic;
  else window.Logic = Logic;
})();
