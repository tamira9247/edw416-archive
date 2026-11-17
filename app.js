(function () {
  "use strict";

  const topics = DATA.topics.slice().sort((a, b) => a.id - b.id);
  const chapters = DATA.chapters;

  const el = {
    tabs: document.getElementById("chapter-tabs"),
    chapterTitle: document.getElementById("chapter-title"),
    list: document.getElementById("topic-list"),
    topic: document.getElementById("topic"),
    prev: document.getElementById("prev-btn"),
    next: document.getElementById("next-btn"),
    pos: document.getElementById("pager-pos"),
  };

  let current = 0; // topics массив дахь индекс

  // ---------- Туслах функцууд ----------

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function chapterOf(topic) {
    return chapters.find((c) => c.id === topic.chapter);
  }

  function topicTitle(topic) {
    return topic.title && topic.title.trim() ? topic.title : "Сэдэв " + topic.id;
  }

  function filled(value) {
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim() !== "";
  }

  function hasContent(topic) {
    return ["goal", "concepts", "lecture", "seminar", "references"].some((k) => filled(topic[k]));
  }

  // Олон мөртэй текстийг догол мөр болгон харуулна
  function paragraphs(text) {
    const frag = document.createDocumentFragment();
    text.split(/\n\s*\n/).forEach((p) => {
      if (p.trim()) frag.appendChild(make("p", null, p.trim()));
    });
    return frag;
  }

  function section(heading, body) {
    const sec = make("section", "topic-section");
    sec.appendChild(make("h3", null, heading));
    sec.appendChild(body);
    return sec;
  }

  // ---------- Зурах ----------

  function renderTabs() {
    el.tabs.innerHTML = "";
    const active = topics[current].chapter;
    chapters.forEach((c) => {
      const btn = make("button", "chapter-tab", c.id + "-р бүлэг");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(c.id === active));
      btn.addEventListener("click", () => {
        const first = topics.findIndex((t) => t.chapter === c.id);
        if (first !== -1 && c.id !== active) go(first);
      });
      el.tabs.appendChild(btn);
    });
    el.chapterTitle.textContent = chapterOf(topics[current]).title;
  }

  function renderList() {
    el.list.innerHTML = "";
    const active = topics[current].chapter;
    topics.forEach((t, i) => {
      if (t.chapter !== active) return;
      const li = make("li");
      const btn = make("button", "topic-link");
      btn.type = "button";
      btn.appendChild(make("span", "topic-week", t.id + "-р 7 хоног"));
      btn.appendChild(make("span", "topic-name", topicTitle(t)));
      if (i === current) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", () => go(i));
      li.appendChild(btn);
      el.list.appendChild(li);
    });
  }

  function renderTopic() {
    const t = topics[current];
    const ch = chapterOf(t);
    el.topic.innerHTML = "";

    el.topic.appendChild(make("p", "topic-meta", ch.id + "-р бүлэг · " + t.id + "-р долоо хоног"));
    el.topic.appendChild(make("h2", null, topicTitle(t)));

    const clo = filled(t.clo) ? t.clo : ch.clo;
    const cloRow = make("div", "clo-row");
    cloRow.appendChild(make("span", "clo-label", "CLO"));
    clo.forEach((n) => cloRow.appendChild(make("span", "clo-badge", String(n))));
    el.topic.appendChild(cloRow);

    if (!hasContent(t)) {
      el.topic.appendChild(make("p", "empty", "Удахгүй нэмэгдэнэ"));
      return;
    }

    if (filled(t.goal)) el.topic.appendChild(section("Сэдвийн зорилго", paragraphs(t.goal)));

    if (filled(t.concepts)) {
      const ul = make("ul", "concepts");
      t.concepts.forEach((c) => ul.appendChild(make("li", null, c)));
      el.topic.appendChild(section("Гол ойлголт", ul));
    }

    if (filled(t.lecture)) el.topic.appendChild(section("Лекц", paragraphs(t.lecture)));
    if (filled(t.seminar)) el.topic.appendChild(section("Семинар", paragraphs(t.seminar)));

    if (filled(t.references)) {
      const ul = make("ul", "references");
      t.references.forEach((r) => {
        const li = make("li");
        li.appendChild(make("span", "ref-title", r.title));
        if (r.clause) li.appendChild(make("span", "ref-clause", r.clause + "-р заалт"));
        ul.appendChild(li);
      });
      el.topic.appendChild(section("Холбогдох хууль, стандарт", ul));
    }
  }

  function renderPager() {
    el.prev.disabled = current === 0;
    el.next.disabled = current === topics.length - 1;
    el.pos.textContent = (current + 1) + " / " + topics.length;
  }

  function render() {
    renderTabs();
    renderList();
    renderTopic();
    renderPager();
  }

  // ---------- Шилжилт ----------

  function go(index) {
    if (index < 0 || index >= topics.length) return;
    current = index;
    history.replaceState(null, "", "#sedev-" + topics[current].id);
    render();
    el.topic.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function indexFromHash() {
    const m = location.hash.match(/^#sedev-(\d+)$/);
    if (!m) return 0;
    const i = topics.findIndex((t) => t.id === Number(m[1]));
    return i === -1 ? 0 : i;
  }

  el.prev.addEventListener("click", () => go(current - 1));
  el.next.addEventListener("click", () => go(current + 1));

  // ---------- Харагдац солих (Агуулга / Дасгал) ----------

  const views = {
    content: [document.getElementById("view-content"), document.getElementById("pager")],
    exercise: [document.getElementById("view-exercise")],
  };
  const viewButtons = document.querySelectorAll("[data-view]");

  function showView(name) {
    Object.keys(views).forEach((k) => views[k].forEach((node) => { node.hidden = k !== name; }));
    viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
  }

  viewButtons.forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));

  // ---------- Алдаа олж засах дасгал ----------

  const exercises = Array.isArray(DATA.exercises) ? DATA.exercises : [];
  const exList = document.getElementById("exercise-list");
  const exArea = document.getElementById("exercise-area");

  // Идэвхтэй дасгалын төлөв
  let ex = null;

  function renderExerciseList() {
    exList.innerHTML = "";
    exArea.innerHTML = "";
    if (exercises.length === 0) {
      exArea.appendChild(make("p", "empty", "Удахгүй нэмэгдэнэ"));
      return;
    }
    exercises.forEach((e, i) => {
      const btn = make("button", "topic-link");
      btn.type = "button";
      btn.appendChild(make("span", "topic-week", e.type));
      btn.appendChild(make("span", "topic-name", e.title));
      btn.addEventListener("click", () => startExercise(i));
      exList.appendChild(make("li")).appendChild(btn);
    });
    exArea.appendChild(make("p", "hint", "Зүүн талаас баримтын жишээ сонгоно уу."));
  }

  function startExercise(index) {
    const exercise = exercises[index];
    ex = {
      index: index,
      exercise: exercise,
      total: exercise.parts.filter((p) => p.error).length,
      found: new Set(),
      wrong: 0,
      finished: false,
      errorButtons: {},
    };
    exList.querySelectorAll("button").forEach((b, j) => {
      if (j === index) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    renderExercise();
  }

  function renderExercise() {
    const e = ex.exercise;
    exArea.innerHTML = "";
    exArea.appendChild(make("p", "topic-meta", e.type));
    exArea.appendChild(make("h2", null, e.title));
    exArea.appendChild(make("p", "hint", "Баримт дээрх алдаатай хэсэг дээр дарна уу."));

    ex.status = make("p", "ex-status");
    exArea.appendChild(ex.status);

    const doc = make("div", "doc");
    e.parts.forEach((part, pi) => {
      if (part.error) {
        const b = make("button", "seg");
        b.type = "button";
        b.appendChild(make("span", "seg-orig", part.text));
        b.addEventListener("click", () => onErrorClick(pi));
        ex.errorButtons[pi] = b;
        doc.appendChild(b);
        return;
      }
      // Алдаагүй хэсгийг үг бүрээр нь дарж болохоор хуваана
      part.text.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          doc.appendChild(document.createTextNode(tok));
          return;
        }
        const b = make("button", "seg", tok);
        b.type = "button";
        b.addEventListener("click", () => onPlainClick(b));
        doc.appendChild(b);
      });
    });
    exArea.appendChild(doc);

    ex.feedback = make("div", "ex-feedback");
    ex.feedback.setAttribute("aria-live", "polite");
    exArea.appendChild(ex.feedback);

    const actions = make("div", "ex-actions");
    ex.finishBtn = make("button", "btn-primary", "Дуусгах");
    ex.finishBtn.type = "button";
    ex.finishBtn.addEventListener("click", finishExercise);
    const restart = make("button", "btn-secondary", "Дахин эхлэх");
    restart.type = "button";
    restart.addEventListener("click", () => startExercise(ex.index));
    actions.appendChild(ex.finishBtn);
    actions.appendChild(restart);
    exArea.appendChild(actions);

    updateStatus();
  }

  function updateStatus() {
    if (ex.finished) {
      const missed = ex.total - ex.found.size;
      ex.status.textContent =
        "Дууссан: олсон " + ex.found.size + " / " + ex.total +
        ", олоогүй " + missed + ", буруу дарсан " + ex.wrong;
    } else {
      ex.status.textContent = "Олсон " + ex.found.size + " / " + ex.total + " · Буруу дарсан: " + ex.wrong;
    }
  }

  // Алдааг зөв хувилбартай нь баримт дээр харуулна
  function revealError(pi, cls) {
    const b = ex.errorButtons[pi];
    b.classList.add(cls);
    if (!b.querySelector(".seg-fix")) {
      b.appendChild(make("span", "seg-fix", ex.exercise.parts[pi].error.correct));
    }
  }

  function errorDetail(part) {
    const box = make("div", "error-detail");
    const line = make("p");
    line.appendChild(make("span", "seg-orig-inline", part.text));
    line.appendChild(document.createTextNode(" → "));
    line.appendChild(make("strong", null, part.error.correct));
    box.appendChild(line);
    if (filled(part.error.explanation)) box.appendChild(make("p", null, part.error.explanation));
    const ref = part.error.reference;
    if (ref && filled(ref.title)) {
      const r = make("p", "ref-inline");
      r.appendChild(make("span", "ref-title", ref.title));
      if (filled(ref.clause)) r.appendChild(make("span", "ref-clause", " · " + ref.clause + "-р заалт"));
      box.appendChild(r);
    }
    return box;
  }

  function setFeedback(kind, heading, nodes) {
    ex.feedback.innerHTML = "";
    ex.feedback.className = "ex-feedback " + kind;
    ex.feedback.appendChild(make("p", "ex-feedback-title", heading));
    (nodes || []).forEach((n) => ex.feedback.appendChild(n));
  }

  function onErrorClick(pi) {
    const part = ex.exercise.parts[pi];
    if (!ex.finished && !ex.found.has(pi)) {
      ex.found.add(pi);
      revealError(pi, "found");
      updateStatus();
    }
    if (ex.found.has(pi)) setFeedback("ok", "Зөв! Алдаа оллоо.", [errorDetail(part)]);
    else setFeedback("bad", "Олоогүй алдаа", [errorDetail(part)]);

    if (!ex.finished && ex.found.size === ex.total) finishExercise();
  }

  function onPlainClick(b) {
    if (!ex.finished) {
      ex.wrong += 1;
      updateStatus();
      b.classList.remove("wrong-flash");
      void b.offsetWidth; // хөдөлгөөнийг дахин эхлүүлнэ
      b.classList.add("wrong-flash");
    }
    setFeedback("neutral", "Энд алдаа байхгүй");
  }

  function finishExercise() {
    if (ex.finished) return;
    ex.finished = true;
    ex.finishBtn.disabled = true;

    const missed = [];
    ex.exercise.parts.forEach((part, pi) => {
      if (part.error && !ex.found.has(pi)) {
        revealError(pi, "missed");
        missed.push(errorDetail(part));
      }
    });
    updateStatus();

    if (missed.length === 0) {
      setFeedback("ok", "Бүх алдааг оллоо!");
    } else {
      setFeedback("bad", "Олоогүй " + missed.length + " алдаа улаанаар тэмдэглэгдлээ:", missed);
    }
  }

  // ---------- Эхлүүлэх ----------

  current = indexFromHash();
  render();
  renderExerciseList();
})();
