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

  current = indexFromHash();
  render();
})();
