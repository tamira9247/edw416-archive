// Feature №8: Явц хадгалах. Дэлгэцээс хамааралгүй цэвэр функцууд (test/progress.test.js шалгана).
// Явцыг localStorage-д { lectures: [id], seminars: [id] } хэлбэрээр хадгална.
// Хожим утасны дугаараар (№6) ялгахдаа KEY-д дугаарыг залгахад хангалттай.
(function (root) {
  "use strict";

  const KEY = "edw416-progress";

  function empty() {
    return { lectures: [], seminars: [] };
  }

  // Хадгалсан явцыг уншина. Хоосон, эвдэрсэн эсвэл storage ажиллахгүй бол хоосон явц
  function load(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return empty();
      const p = JSON.parse(raw);
      const ids = (a) => (Array.isArray(a) ? a.filter((x) => Number.isInteger(x)) : []);
      return { lectures: ids(p && p.lectures), seminars: ids(p && p.seminars) };
    } catch (e) {
      return empty();
    }
  }

  // Хадгална. Алдаа гарвал (хувийн цонх г.м) чимээгүй үргэлжилнэ
  function save(storage, p) {
    try {
      storage.setItem(KEY, JSON.stringify(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  function has(p, kind, id) {
    return p[kind].indexOf(id) !== -1;
  }

  // Уншсан/уншаагүйг сольж, шинэ объект буцаана (kind: "lectures" эсвэл "seminars")
  function toggle(p, kind, id) {
    const next = { lectures: p.lectures.slice(), seminars: p.seminars.slice() };
    next[kind] = has(p, kind, id) ? next[kind].filter((x) => x !== id) : next[kind].concat(id);
    return next;
  }

  // Нийт болон бүлэг тус бүрийн явц. Бүлэгт тухайн бүлгийн лекц, түүний семинарууд орно
  function summary(p, course, seminars) {
    const chapters = course.chapters.map((c) => {
      const lecs = course.lectures.filter((l) => l.chapter === c.id);
      const lecIds = lecs.map((l) => l.id);
      const sems = seminars.filter((s) => lecIds.indexOf(s.lecture) !== -1);
      const done = lecs.filter((l) => has(p, "lectures", l.id)).length +
        sems.filter((s) => has(p, "seminars", s.id)).length;
      return { id: c.id, title: c.title, done: done, total: lecs.length + sems.length };
    });
    const done = chapters.reduce((a, c) => a + c.done, 0);
    const total = chapters.reduce((a, c) => a + c.total, 0);
    return { done: done, total: total, percent: total ? Math.round((done * 100) / total) : 0, chapters: chapters };
  }

  // ---------- Supabase (progress хүснэгт) ----------

  // "lectures" → "lecture", "seminars" → "seminar" (баазын kind багана)
  function dbKind(kind) {
    return kind === "lectures" ? "lecture" : "seminar";
  }

  // Баазын мөрүүдийг ({ kind, item_id }) явц болгоно. Танихгүй мөрийг алгасна
  function fromRows(rows) {
    const p = empty();
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      const k = r && r.kind === "lecture" ? "lectures" : r && r.kind === "seminar" ? "seminars" : null;
      if (k && Number.isInteger(r.item_id) && !has(p, k, r.item_id)) p[k].push(r.item_id);
    });
    return p;
  }

  // local-д тэмдэглэсэн боловч remote-д байхгүйг баазын мөр болгоно (нэг удаагийн нэгтгэл).
  // valid: { lectures: [id], seminars: [id] } — одоо байгаа лекц, семинарын id
  function missing(local, remote, valid) {
    const out = [];
    ["lectures", "seminars"].forEach((k) => {
      local[k].forEach((id) => {
        if (!has(remote, k, id) && valid[k].indexOf(id) !== -1) out.push({ kind: dbKind(k), item_id: id });
      });
    });
    return out;
  }

  // Нэгтгэсний дараа localStorage-ийн хуучин явцыг устгана
  function clear(storage) {
    try { storage.removeItem(KEY); } catch (e) { /* хувийн цонх г.м */ }
  }

  const api = {
    KEY: KEY, empty: empty, load: load, save: save, has: has, toggle: toggle, summary: summary,
    dbKind: dbKind, fromRows: fromRows, missing: missing, clear: clear
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PROGRESS = api;
})(this);
