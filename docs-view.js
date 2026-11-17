/* Feature №3: "Баримт бичиг" хэсэг. 3 төрөл → 31 баримт → баримт бүрийн нэг хуудас.
 * index.html-ийн view-docs хэсгийн ID-уудыг ашиглана: docs-tabs, docs-title,
 * docs-list, docs-area, docs-pager (docs-prev, docs-next, docs-pos).
 * HTML-д орох бүх текстийг esc()-ээр цэвэрлэнэ (өгөгдөл нь багшийн docs-data.js).
 */
(function () {
  var M = window.MNS;
  var $ = function (id) { return document.getElementById(id); };
  var root = $("view-docs");
  if (!M || !root) return;
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var groupOf = function (id) { return M.groups.filter(function (g) { return g.id === id; })[0]; };
  var state = { group: M.groups[0].id, index: 0, mode: "paper" };

  /* --- A4 схем дээрх бүрдлийн байрлал (MNS 5140-3, А1/А2 хавсралт), % --- */
  var POS = {
    center: {
      "01": [44, 7], "02": [56, 7], "11": [88, 5], "24": [80, 11], "25": [62, 11],
      "03": [50, 13], "04": [50, 16.5], "05": [50, 20], "06": [50, 23.5],
      "07": [14, 27], "08": [50, 27], "09": [86, 27], "10": [50, 30.5],
      "12": [50, 33.5], "13": [50, 37], "14": [16, 43],
      "23": [80, 68], "15": [12, 74], "16": [23, 74], "26": [30, 79],
      "17": [38, 82], "18": [50, 82], "19": [62, 82],
      "27": [76, 89], "28": [88, 89], "21": [88, 96.5]
    },
    side: {
      "01": [19, 6.5], "02": [37, 6.5], "11": [90, 5], "03": [27, 12.5], "04": [27, 15.5],
      "06": [27, 19], "07": [16, 24], "08": [40, 24], "10": [28, 28.5], "13": [27, 32],
      "12": [74, 13], "23": [74, 22], "14": [14, 42],
      "15": [12, 74], "16": [23, 74], "17": [40, 82], "18": [52, 82], "19": [64, 82],
      "27": [76, 89], "28": [88, 89], "21": [88, 96.5]
    }
  };
  var BACK = ["20", "22"]; // хуудасны АРЫН талд

  function expand(list) {
    // "01/02" → ["01","02"] (alt тэмдэгтэй)
    var out = [];
    list.forEach(function (c) {
      if (c.indexOf("/") > -1) c.split("/").forEach(function (x) { out.push({ code: x, alt: true }); });
      else out.push({ code: c, alt: false });
    });
    return out;
  }
  function codesOf(list) { return expand(list).map(function (x) { return x.code; }); }

  /* ---------- жагсаалт ---------- */
  function docsIn(g) { return M.docs.filter(function (d) { return d.group === g; }); }

  function renderTabs() {
    $("docs-tabs").innerHTML = M.groups.map(function (g) {
      var n = docsIn(g.id).length;
      return '<button type="button" class="chapter-tab" role="tab" data-group="' + esc(g.id) + '" aria-selected="' +
        (g.id === state.group) + '">' + esc(g.short) + ' <span class="count">' + n + "</span></button>";
    }).join("");
    var g = groupOf(state.group);
    $("docs-title").innerHTML = "<strong>" + esc(g.name) + "</strong><br><span class=\"muted\">" +
      esc(g.def) + " <em>(MNS " + esc(g.clause) + ")</em></span>";
  }

  function renderList() {
    var list = docsIn(state.group);
    $("docs-list").innerHTML = list.map(function (d, i) {
      return '<li><button type="button" class="topic-link" data-i="' + i + '" aria-current="' + (i === state.index) + '">' +
        '<span class="topic-week">' + esc(d.clause) + '</span> <span class="topic-name">' + esc(d.name) + "</span></button></li>";
    }).join("");
  }

  /* ---------- баримтын хуудас ---------- */
  function chips(list, other) {
    var otherCodes = codesOf(other);
    return expand(list).map(function (x) {
      var c = M.components[x.code];
      var only = otherCodes.indexOf(x.code) === -1;
      return '<button type="button" class="chip' + (x.alt ? " alt" : "") + (only ? " only" : "") +
        '" data-code="' + esc(x.code) + '" title="' + esc(c.name) + '"><b>' + esc(x.code) + "</b> " + esc(c.name) +
        (x.alt ? " <i>эсхүл</i>" : "") + "</button>";
    }).join("");
  }

  function sheet(d, list) {
    var layout = d.layout === "side" ? "side" : "center";
    var pos = POS[layout];
    var codes = codesOf(list);
    var dots = codes.filter(function (c) { return pos[c]; }).map(function (c) {
      var p = pos[c];
      var cls = c === "14" ? "dot body" : "dot";
      return '<button type="button" class="' + cls + '" data-code="' + c + '" style="left:' + p[0] + "%;top:" + p[1] +
        '%" title="' + esc(M.components[c].name) + '">' + c + "</button>";
    }).join("");
    var back = codes.filter(function (c) { return BACK.indexOf(c) > -1; });
    var body = codes.indexOf("14") > -1 ? '<div class="body-area"></div>' : "";
    return '<div class="sheet-wrap"><div class="sheet ' + layout + '">' + body + dots + "</div>" +
      '<p class="sheet-cap">' + (layout === "side" ? "Хажуугийн байрлал (А1 хавсралт)" : "Төвийн байрлал (А2 хавсралт)") +
      (back.length ? "<br>Арын талд: " + back.map(function (c) {
        return '<button type="button" class="chip mini" data-code="' + c + '"><b>' + c + "</b> " + esc(M.components[c].name) + "</button>";
      }).join(" ") : "") + "</p></div>";
  }

  function layoutFacts(d) {
    var hasForm = d.paper.some(function (c) { return c.indexOf("01") > -1 || c.indexOf("02") > -1; });
    var rows = [];
    rows.push(["Цаас", d.group === "zah" ? "А4 (297×210 мм) — 5140-3: 3.4" : "А4 босоо/хөндлөн, эсхүл А5 (210×148 мм) — 5140-3: 3.4"]);
    rows.push(["Байрлал", d.layout === "side"
      ? "А4 — хажуугийн (зүүн дээд хэсэгт); А5 — төвийн (5140-3: 3.7)"
      : "Төвийн — бүрдлүүд дээд хэсэгт голлуулсан (5140-3: 3.6–3.7)"]);
    rows.push(["Хэвлэмэл хуудас", hasForm
      ? "Тийм" + (d.form ? " — загвар: " + d.form + " хавсралт" : "")
      : (d.note ? "Ерөнхийдөө үгүй. " + d.note : "Үгүй — нэрийг байгууллагын нэрийн доор төвд бичнэ (5.5)")]);
    if (d.emblem) rows.push(["Төрийн сүлд", d.emblem]);
    else if (hasForm) rows.push(["Сүлд / бэлгэ тэмдэг", "Өндөр: А4-т 21 мм, А5-д 15 мм (5140-3: 3.3)"]);
    rows.push(["Захын зай", "Дээд 20, доод 20, зүүн 30, баруун 15 мм (А4 босоо; 5.14.3)"]);
    rows.push(["Үсэг", "Arial 11–12 pt / Times New Roman 12–14 pt; хүснэгт 9–11 pt; хаяг Arial 8 pt"]);
    return '<table class="facts">' + rows.map(function (r) {
      return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>";
    }).join("") + "</table>";
  }

  function renderDoc() {
    var list = docsIn(state.group);
    var d = list[state.index];
    var g = groupOf(d.group);
    var w = M.groupWriting[d.group];
    var cur = state.mode === "paper" ? d.paper : d.digital;
    var other = state.mode === "paper" ? d.digital : d.paper;

    var html = "";
    html += '<header class="doc-head"><p class="kicker">' + esc(g.name) + " · MNS 5140-1:2026, " + esc(d.clause) + "</p>" +
      "<h2>" + esc(d.name.toUpperCase()) + "</h2></header>";

    // 1. Тодорхойлолт
    html += '<section class="blk"><h3>Тодорхойлолт</h3><blockquote>' + esc(d.def) +
      "<cite>MNS 5140-1:2026, " + esc(d.clause) + "</cite></blockquote></section>";

    // 2. Бүрдэл
    html += '<section class="blk"><h3>Бүрдэл <span class="muted">(' + codesOf(cur).length +
      ')</span></h3><div class="mode-switch" role="group" aria-label="Хэлбэр">' +
      '<button type="button" data-mode="paper" aria-pressed="' + (state.mode === "paper") + '">Цаасан</button>' +
      '<button type="button" data-mode="digital" aria-pressed="' + (state.mode === "digital") + '">Цахим</button></div>' +
      '<div class="chips">' + chips(cur, other) + "</div>" +
      '<p class="legend"><span class="sw only"></span> зөвхөн ' + (state.mode === "paper" ? "цаасан" : "цахим") +
      ' хэлбэрт &nbsp; <span class="sw alt"></span> 01 эсхүл 02 — аль нэг нь' +
      (d.note ? "<br>Тайлбар: " + esc(d.note) : "") + " <em>(MNS 5140-2:2026, 4.2)</em></p>" +
      '<div class="rule" id="docs-rule" hidden></div></section>';

    // 3. Байршил
    html += '<section class="blk"><h3>Байршил ба хэвлэмэл хуудас</h3><div class="two">' +
      sheet(d, cur) + layoutFacts(d) + "</div></section>";

    // 4. Хэрхэн бичих
    html += '<section class="blk"><h3>Хэрхэн бичих</h3>';
    if (d.specific && d.specific.length) {
      html += '<div class="special"><p class="sub">Энэ баримтын онцлог</p><ul>' +
        d.specific.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
    }
    html += '<p class="sub">Бичих алхам · ' + esc(g.name) + '</p><ol class="steps">' +
      w.steps.map(function (s) { return "<li><b>" + esc(s[0]) + ".</b> " + esc(s[1]) + "</li>"; }).join("") + "</ol>";
    html += '<p class="sub">Шалгах хуудас</p><ul class="check">' +
      w.check.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></section>";

    // 5. nairuulga.mn
    html += '<section class="blk nr"><h3>nairuulga.mn</h3>';
    if (d.nr) {
      html += '<p><a href="' + esc(d.nr.url) + '" target="_blank" rel="noopener">"' + esc(d.name) +
        '" хуудас ↗</a><br>' + esc(d.nr.note) + "</p>";
    } else {
      html += '<p class="muted">Энэ баримтад nairuulga.mn-д тусдаа хуудас алга.</p>';
    }
    html += '<p class="sub">Ерөнхий хэл найруулга</p><ul>' + M.general.map(function (x) {
      return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + " ↗</a>" +
        (x.note ? " — " + esc(x.note) : "") + "</li>";
    }).join("") + '</ul><p class="muted small">nairuulga.mn-ийн жишээнүүд MNS 5140:2026-аас өмнөх үеийнх байж болно — огноо, дугаарын хэлбэрийг стандарттай тулгаж үзээрэй.</p></section>';

    $("docs-area").innerHTML = html;

    // pager: 31 баримтыг дараалан
    var gi = M.docs.indexOf(d);
    $("docs-pos").textContent = (gi + 1) + " / " + M.docs.length;
    $("docs-prev").disabled = gi === 0;
    $("docs-next").disabled = gi === M.docs.length - 1;
  }

  function showRule(code) {
    var c = M.components[code];
    var box = $("docs-rule");
    if (!box || !c) return;
    box.hidden = false;
    box.innerHTML = "<p><b>" + esc(code) + " · " + esc(c.name) + '</b> <span class="muted">(MNS 5140-2:2026, ' +
      esc(c.clause) + ")</span></p><p>" + esc(c.rule) + "</p>";
    root.querySelectorAll("[data-code]").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-code") === code);
    });
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function renderAll() { renderTabs(); renderList(); renderDoc(); }

  function goFlat(i) {
    var d = M.docs[i];
    if (!d) return;
    state.group = d.group;
    state.index = docsIn(d.group).indexOf(d);
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- үйлдэл (зөвхөн энэ хэсэг дотор) ---------- */
  root.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.group) { state.group = t.dataset.group; state.index = 0; renderAll(); return; }
    if (t.dataset.i !== undefined && t.closest("#docs-list")) { state.index = +t.dataset.i; renderList(); renderDoc(); return; }
    if (t.dataset.mode) { state.mode = t.dataset.mode; renderDoc(); return; }
    if (t.dataset.code) { showRule(t.dataset.code); }
  });

  function step(delta) { goFlat(M.docs.indexOf(docsIn(state.group)[state.index]) + delta); }
  $("docs-prev").addEventListener("click", function () { step(-1); });
  $("docs-next").addEventListener("click", function () { step(1); });

  renderAll();
})();
