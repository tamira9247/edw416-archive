// E.DW416 суралцах вэб: Лекц, Семинар, Эрх зүйн сан, Лавлах, Зураглал, Миний явц.
// Өгөгдөл: lectures.js (window.COURSE), seminars.js (window.SEMINARS), laws.js (window.LAWS).
// Лавлах хэсгийг docs-view.js өөрөө зурна; энд зөвхөн харагдацыг солино.
// Бүх текстийг textContent-оор гаргана.
(function () {
  "use strict";

  const COURSE = window.COURSE;
  const SEMINARS = window.SEMINARS;
  const LAWS = window.LAWS;
  const $ = (id) => document.getElementById(id);

  const lawById = {};
  LAWS.items.forEach((l) => { lawById[l.id] = l; });

  // ---------- Явц (progress.js) ----------

  const P = window.PROGRESS;
  let store = null;
  try { store = window.localStorage; } catch (e) { store = null; }
  const noStore = { getItem: () => null, setItem: () => { throw new Error("storage алга"); } };
  let progress = P.load(store || noStore);

  // Уншсан/уншаагүйг сольж хадгалаад дэлгэцийг шинэчилнэ
  function toggleRead(kind, id) {
    progress = P.toggle(progress, kind, id);
    P.save(store || noStore, progress);
    render();
  }

  // Хуудасны төгсгөлийн "Уншсан гэж тэмдэглэх" товч
  function readButton(kind, id) {
    const done = P.has(progress, kind, id);
    const b = make("button", "read-btn" + (done ? " done" : ""), done ? "Уншсан ✓" : "Уншсан гэж тэмдэглэх");
    b.type = "button";
    b.setAttribute("aria-pressed", String(done));
    b.addEventListener("click", () => toggleRead(kind, id));
    return b;
  }

  // Жагсаалтын нэрний өмнөх ✓ тэмдэг
  function readMark(kind, id) {
    return P.has(progress, kind, id) ? make("span", "read-mark", "✓ ") : null;
  }

  // ---------- Туслах функц ----------

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function section(heading, children) {
    const s = make("section", "topic-section");
    s.appendChild(make("h3", "", heading));
    children.forEach((c) => s.appendChild(c));
    return s;
  }

  function list(tag, items) {
    const ul = make(tag);
    items.forEach((t) => ul.appendChild(make("li", "", t)));
    return ul;
  }

  function table(t) {
    const wrap = make("div", "table-wrap");
    const tb = make("table", "data");
    const thead = make("thead");
    const hr = make("tr");
    t.head.forEach((h) => hr.appendChild(make("th", "", h)));
    thead.appendChild(hr);
    tb.appendChild(thead);
    const body = make("tbody");
    t.rows.forEach((r) => {
      const tr = make("tr");
      r.forEach((c, i) => {
        const td = make("td", "", c);
        td.dataset.l = t.head[i] || "";
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    tb.appendChild(body);
    wrap.appendChild(tb);
    return wrap;
  }

  // Лекцийн блок: p, ul, ol, table, note
  function block(b) {
    if (b.p) return make("p", "", b.p);
    if (b.ul) return list("ul", b.ul);
    if (b.ol) return list("ol", b.ol);
    if (b.table) return table(b.table);
    if (b.note) return make("p", "note", b.note);
    return make("p");
  }

  function statusChip(status) {
    const cls = status === "хүчинтэй" ? "ok" : status === "хүчингүй" ? "bad" : "warn";
    return make("span", "status " + cls, status);
  }

  function lawLink(law) {
    if (law.url) {
      const a = make("a", "", "Эх сурвалж нээх");
      a.href = law.url;
      a.target = "_blank";
      a.rel = "noopener";
      return a;
    }
    return make("span", "muted", 'legalinfo.mn / estandard.gov.mn-ээс "' + (law.search || law.title) + '" гэж хайна');
  }

  function lawItem(law) {
    const li = make("li", "law");
    const top = make("div", "law-top");
    top.appendChild(make("span", "law-title", law.title));
    top.appendChild(statusChip(law.status));
    li.appendChild(top);
    const meta = [law.date, law.no ? "№ " + law.no : ""].filter(Boolean).join(" · ");
    if (meta) li.appendChild(make("div", "law-meta", meta));
    if (law.note) li.appendChild(make("div", "law-note", law.note));
    li.appendChild(lawLink(law));
    return li;
  }

  function lawList(ids) {
    const ul = make("ul", "laws");
    ids.forEach((id) => { if (lawById[id]) ul.appendChild(lawItem(lawById[id])); });
    return ul;
  }

  function cloRow(clo) {
    const row = make("div", "clo-row");
    row.appendChild(make("span", "clo-label", "CLO"));
    clo.forEach((c) => row.appendChild(make("span", "clo-badge", String(c))));
    return row;
  }

  // ---------- Лекц ----------

  const lectures = COURSE.lectures;
  const chapterOf = (lec) => COURSE.chapters.filter((c) => c.id === lec.chapter)[0];

  function renderLectureList() {
    const ol = $("lecture-list");
    ol.textContent = "";
    lectures.forEach((lec, i) => {
      const li = make("li");
      const b = make("button", "topic-link");
      b.type = "button";
      b.appendChild(make("span", "topic-week", "Лекц " + lec.id + " · " + lec.weeks + "-р долоо хоног"));
      const name = make("span", "topic-name", lec.title);
      const mark = readMark("lectures", lec.id);
      if (mark) name.insertBefore(mark, name.firstChild);
      b.appendChild(name);
      if (state.view === "lecture" && i === state.lecture) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => go("lecture", i));
      li.appendChild(b);
      ol.appendChild(li);
    });
  }

  function renderLecture() {
    const lec = lectures[state.lecture];
    const art = $("lecture-area");
    art.textContent = "";
    art.appendChild(make("p", "topic-meta", "Бүлэг " + lec.chapter + ". " + chapterOf(lec).title));
    art.appendChild(make("h2", "", "Лекц " + lec.id + ". " + lec.title));
    art.appendChild(make("p", "topic-meta", lec.weeks + "-р долоо хоног · 90 минут"));
    art.appendChild(cloRow(lec.clo));

    art.appendChild(section("Зорилго", [list("ul", lec.goal)]));

    const dl = make("dl", "concepts");
    lec.concepts.forEach((c) => {
      dl.appendChild(make("dt", "", c.term));
      const dd = make("dd", "", c.def);
      dd.appendChild(make("span", "ref", " (" + c.ref + ")"));
      dl.appendChild(dd);
    });
    art.appendChild(section("Гол ойлголт", [dl]));

    lec.sections.forEach((s) => art.appendChild(section(s.h, s.blocks.map(block))));

    art.appendChild(section("Холбогдох эрх зүйн акт", [lawList(lec.laws)]));

    const sems = SEMINARS.filter((s) => s.lecture === lec.id);
    const semBox = make("div", "chips");
    sems.forEach((s) => {
      const b = make("button", "chip", "Семинар " + s.id + ": " + s.title);
      b.type = "button";
      b.addEventListener("click", () => go("seminar", s.id - 1));
      semBox.appendChild(b);
    });
    art.appendChild(section("Энэ лекцийн семинар", [semBox]));
    art.appendChild(readButton("lectures", lec.id));
  }

  // ---------- Семинар ----------

  function renderSeminarList() {
    const ol = $("seminar-list");
    ol.textContent = "";
    SEMINARS.forEach((s, i) => {
      const li = make("li");
      const b = make("button", "topic-link");
      b.type = "button";
      b.appendChild(make("span", "topic-week", "Семинар " + s.id + " · " + s.week + "-р долоо хоног"));
      const name = make("span", "topic-name", s.title);
      const mark = readMark("seminars", s.id);
      if (mark) name.insertBefore(mark, name.firstChild);
      b.appendChild(name);
      if (state.view === "seminar" && i === state.seminar) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => go("seminar", i));
      li.appendChild(b);
      ol.appendChild(li);
    });
  }

  function renderSeminar() {
    const s = SEMINARS[state.seminar];
    const lec = lectures[s.lecture - 1];
    const art = $("seminar-area");
    art.textContent = "";
    const back = make("button", "linklike", "Лекц " + lec.id + ". " + lec.title);
    back.type = "button";
    back.addEventListener("click", () => go("lecture", lec.id - 1));
    const meta = make("p", "topic-meta", s.week + "-р долоо хоног · 90 минут · ");
    meta.appendChild(back);
    art.appendChild(meta);
    art.appendChild(make("h2", "", "Семинар " + s.id + ". " + s.title));

    art.appendChild(section("Зорилго", [make("p", "", s.goal)]));
    art.appendChild(section("Урьдчилан бэлтгэх", [list("ul", s.prepare)]));
    art.appendChild(section("Хийх ажил", [list("ol", s.steps)]));
    art.appendChild(section("Гаргах бүтээл", [make("p", "", s.output)]));
    if (s.task) art.appendChild(section("Бие даалт", [make("p", "note", s.task.text)]));
    if (s.ref) art.appendChild(section("Лавлах хэсгээс харах", [make("p", "", s.ref)]));
    art.appendChild(section("Холбогдох эрх зүйн акт", [lawList(s.laws)]));
    art.appendChild(readButton("seminars", s.id));
  }

  // ---------- Миний явц ----------

  // Дүүрэх зурвас: "гарчиг — N / M (X%)"
  function bar(label, done, total) {
    const pct = total ? Math.round((done * 100) / total) : 0;
    const wrap = make("div", "bar-row");
    wrap.appendChild(make("p", "bar-label", label + ": " + done + " / " + total + " (" + pct + "%)"));
    const track = make("div", "bar");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(total));
    track.setAttribute("aria-valuenow", String(done));
    track.setAttribute("aria-label", label);
    const fill = make("div", "bar-fill");
    fill.style.width = pct + "%";
    track.appendChild(fill);
    wrap.appendChild(track);
    return wrap;
  }

  function renderProgress() {
    const art = $("progress-area");
    art.textContent = "";
    const sum = P.summary(progress, COURSE, SEMINARS);
    art.appendChild(make("h2", "", "Миний явц"));
    art.appendChild(make("p", "topic-meta", "Уншсан лекц, семинараа тухайн хуудасны доорх товчоор тэмдэглэнэ. Явц энэ төхөөрөмж дээр хадгалагдана."));
    art.appendChild(bar("Нийт", sum.done, sum.total));
    art.appendChild(section("Бүлгээр", sum.chapters.map((c) => bar("Бүлэг " + c.id + ". " + c.title, c.done, c.total))));

    // Уншаагүй лекц, семинарууд
    const left = make("div", "chips");
    lectures.forEach((lec, i) => {
      if (P.has(progress, "lectures", lec.id)) return;
      const b = make("button", "chip", "Лекц " + lec.id + ": " + lec.title);
      b.type = "button";
      b.addEventListener("click", () => go("lecture", i));
      left.appendChild(b);
    });
    SEMINARS.forEach((s, i) => {
      if (P.has(progress, "seminars", s.id)) return;
      const b = make("button", "chip", "Семинар " + s.id + ": " + s.title);
      b.type = "button";
      b.addEventListener("click", () => go("seminar", i));
      left.appendChild(b);
    });
    const body = left.childNodes.length ? left : make("p", "note", "Бүх лекц, семинарыг уншсан байна.");
    art.appendChild(section("Уншаагүй", [body]));
  }

  // ---------- Эрх зүйн сан ----------

  function renderLaws() {
    const art = $("laws-area");
    art.textContent = "";
    art.appendChild(make("h2", "", "Эрх зүйн сан"));
    art.appendChild(make("p", "topic-meta",
      "Хичээлд хамаарах хууль, журам, стандарт. Статусыг " + LAWS.CHECKED +
      "-нд шалгав. \"Шалгах\" гэсэн актын хүчин төгөлдөр эсэхийг legalinfo.mn-ээс нягтална."));
    LAWS.groups.forEach((g) => {
      const items = LAWS.items.filter((l) => l.group === g.id);
      if (!items.length) return;
      const ul = make("ul", "laws");
      items.forEach((l) => {
        const li = lawItem(l);
        const used = lectures.filter((lec) => lec.laws.indexOf(l.id) >= 0);
        if (used.length) {
          const box = make("div", "law-used");
          box.appendChild(make("span", "muted", "Лекц: "));
          used.forEach((lec) => {
            const b = make("button", "chip small", String(lec.id));
            b.type = "button";
            b.title = lec.title;
            b.addEventListener("click", () => go("lecture", lec.id - 1));
            box.appendChild(b);
          });
          li.appendChild(box);
        }
        ul.appendChild(li);
      });
      art.appendChild(section(g.title, [ul]));
    });
  }

  // ---------- Харагдац, шилжилт ----------

  const views = {
    lecture: [$("view-lecture"), $("pager")],
    seminar: [$("view-seminar"), $("pager")],
    laws: [$("view-laws")],
    docs: [$("view-docs"), $("docs-pager")],
    map: [$("view-map")],
    progress: [$("view-progress")]
  };
  const viewButtons = document.querySelectorAll("[data-view]");
  const state = { view: "lecture", lecture: 0, seminar: 0 };

  function hashFor() {
    if (state.view === "lecture") return "#lekts-" + (state.lecture + 1);
    if (state.view === "seminar") return "#seminar-" + (state.seminar + 1);
    return { laws: "#erh-zui", docs: "#lavlakh", map: "#zuraglal", progress: "#miniy-yavts" }[state.view];
  }

  function render() {
    const shown = new Set();
    Object.keys(views).forEach((k) => { if (k === state.view) views[k].forEach((n) => shown.add(n)); });
    Object.keys(views).forEach((k) => views[k].forEach((n) => { n.hidden = !shown.has(n); }));
    viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));

    if (state.view === "lecture") { renderLectureList(); renderLecture(); }
    if (state.view === "seminar") { renderSeminarList(); renderSeminar(); }
    if (state.view === "laws") renderLaws();
    if (state.view === "progress") renderProgress();
    if (state.view === "map" && !$("map-frame").src) $("map-frame").src = "mindmap.html";

    // Утсан дээр хэвтээ жагсаалтад сонгосон зүйлийг харагдуулна
    const cur = document.querySelector('#view-' + state.view + ' [aria-current="true"]');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest", inline: "center" });

    const paged = state.view === "lecture" || state.view === "seminar";
    if (paged) {
      const total = state.view === "lecture" ? lectures.length : SEMINARS.length;
      const idx = state.view === "lecture" ? state.lecture : state.seminar;
      $("prev-btn").disabled = idx === 0;
      $("next-btn").disabled = idx === total - 1;
      $("pager-pos").textContent = (idx + 1) + " / " + total;
    }
  }

  function go(view, index) {
    state.view = view;
    if (view === "lecture" && index !== undefined) state.lecture = index;
    if (view === "seminar" && index !== undefined) state.seminar = index;
    render();
    history.replaceState(null, "", hashFor());
    window.scrollTo({ top: 0 });
  }

  function step(d) {
    if (state.view === "lecture") go("lecture", Math.min(Math.max(state.lecture + d, 0), lectures.length - 1));
    if (state.view === "seminar") go("seminar", Math.min(Math.max(state.seminar + d, 0), SEMINARS.length - 1));
  }

  // Хаягаас (#lekts-3, #seminar-5, #erh-zui, #lavlakh, #zuraglal, #miniy-yavts) эхлэх байрлал
  function fromHash(h) {
    let m = /^#lekts-(\d+)$/.exec(h);
    if (m) { const i = +m[1] - 1; if (i >= 0 && i < lectures.length) return ["lecture", i]; }
    m = /^#seminar-(\d+)$/.exec(h);
    if (m) { const i = +m[1] - 1; if (i >= 0 && i < SEMINARS.length) return ["seminar", i]; }
    const named = { "#erh-zui": "laws", "#lavlakh": "docs", "#zuraglal": "map", "#miniy-yavts": "progress" }[h];
    if (named) return [named];
    return ["lecture", 0];
  }

  viewButtons.forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
  $("prev-btn").addEventListener("click", () => step(-1));
  $("next-btn").addEventListener("click", () => step(1));
  window.addEventListener("hashchange", () => { const r = fromHash(location.hash); go(r[0], r[1]); });

  $("checked-note").textContent = "Эрх зүйн актын статусыг " + LAWS.CHECKED + "-нд шалгав.";

  const start = fromHash(location.hash);
  go(start[0], start[1]);
})();
