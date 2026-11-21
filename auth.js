// Feature №6: утасны дугаараар нэвтрэх (verify.mn).
// 1. Оюутан дугаараа бичнэ, login-start функц 6 оронтой код үүсгэнэ.
// 2. Оюутан өөрийн утаснаас 144773 руу тэр кодыг SMS-ээр илгээнэ.
// 3. Апп 3 секунд тутам login-check-ээр шалгаж, баталгаажмагц нэвтэрнэ.
// Цэвэр функцуудыг (phone, errorText, remaining) test/auth.test.js шалгана.
// Бусад хэсэг (жишээ нь №8) window.AUTH.client, AUTH.onChange-ийг ашиглана.
(function (root) {
  "use strict";

  const POLL_MS = 3000; // verify.mn 3 секундээс олон шалгахгүй байхыг зөвлөдөг

  // Оруулсан дугаараас 8 оронтой дугаарыг гаргана: зай, зураас, хаалт, +976 / 976 угтварыг хасна.
  // Буруу бол null
  function phone(input) {
    let d = String(input == null ? "" : input).replace(/[\s\-().]/g, "");
    if (d.charAt(0) === "+") d = d.slice(1);
    if (d.length === 11 && d.indexOf("976") === 0) d = d.slice(3);
    return /^[0-9]{8}$/.test(d) ? d : null;
  }

  // Функцээс ирсэн алдааны кодыг оюутанд ойлгомжтой мессеж болгоно
  function errorText(code) {
    if (code === "bad_phone") return "Утасны дугаар 8 оронтой байна.";
    if (code === "too_many") return "Хэт олон удаа оролдлоо. 10 минутын дараа дахин оролдоно уу.";
    if (code === "local_test_only") return "Дотоод орчинд зөвхөн тест дугаар (99000001 г.м) ажиллана.";
    if (code === "EXPIRED") return "Хугацаа дууслаа. Дахин оролдоно уу.";
    return "Алдаа гарлаа. Дахин оролдоно уу.";
  }

  // Үлдсэн хугацааг "1:05" хэлбэрээр. Дууссан бол "0:00"
  function remaining(expiresAt, now) {
    const s = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  const api = { phone: phone, errorText: errorText, remaining: remaining, client: null, user: null, onChange: onChange };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }
  root.AUTH = api;

  // ---------- Хөтөч дээрх хэсэг ----------

  const cfg = root.CONFIG || {};
  if (!cfg.url || !cfg.key || !root.supabase) return; // тохиргоогүй бол нэвтрэх товч нуугдмал хэвээр

  const $ = (id) => document.getElementById(id);
  const sb = root.supabase.createClient(cfg.url, cfg.key);
  api.client = sb;

  const btn = $("auth-btn");
  const dlg = $("auth-dialog");
  const phoneForm = $("auth-phone-form");
  const phoneInput = $("auth-phone");
  const wait = $("auth-wait");
  const codeText = $("auth-code-text");
  const smsLink = $("auth-sms-link");
  const status = $("auth-status");
  const backBtn = $("auth-back");
  const err = $("auth-error");

  let login = null;  // { loginId, code, smsUri, expiresAt }
  let timer = null;  // шалгах, цаг тоолох давталт

  // Edge Function дуудна. Алдаа гарвал { error } буцаана
  async function call(name, payload) {
    try {
      const r = await fetch(cfg.url + "/functions/v1/" + name, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.key, Authorization: "Bearer " + cfg.key },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      return r.ok || data.status ? data : { error: data.error || "server" };
    } catch (e) {
      return { error: "network" };
    }
  }

  // Supabase дугаарыг улсын кодтой (97699112233) хадгална, харуулахдаа сүүлийн 8 оронг авна
  function shown(user) {
    return user && user.phone ? String(user.phone).slice(-8) : "";
  }

  function setUser(user) {
    api.user = user || null;
    btn.textContent = user ? shown(user) + " · Гарах" : "Нэвтрэх";
    btn.setAttribute("aria-label", user ? shown(user) + " дугаараар нэвтэрсэн. Гарах" : "Нэвтрэх");
    // onAuthStateChange дотроос supabase-ийн өөр функц дуудвал түгжигддэг тул
    // сонсогчдыг (№8 явц унших г.м) дараагийн мөчлөгт дуудна
    const u = api.user;
    setTimeout(() => listeners.forEach((fn) => fn(u)), 0);
  }

  function showError(text) {
    err.textContent = text || "";
    err.hidden = !text;
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function openPhoneStep() {
    stop();
    login = null;
    showError("");
    phoneForm.hidden = false;
    wait.hidden = true;
    if (!dlg.open) dlg.showModal();
    phoneInput.focus();
  }

  // Хугацаа дууссан үед шалгахыг зогсоож, дахин оролдохыг санал болгоно
  function expired() {
    stop();
    status.textContent = "";
    smsLink.hidden = true;
    backBtn.textContent = "Дахин оролдох";
    showError(errorText("EXPIRED"));
  }

  let checking = false;
  async function check() {
    if (!login || checking) return;
    checking = true;
    const res = await call("login-check", { loginId: login.loginId });
    checking = false;
    if (!login) return;
    if (res.status === "VERIFIED" && res.tokenHash) {
      stop();
      status.textContent = "Баталгаажлаа. Нэвтэрч байна.";
      const v = await sb.auth.verifyOtp({ token_hash: res.tokenHash, type: "magiclink" }).catch((x) => ({ error: x }));
      if (v.error) { showError(errorText("server")); return; }
      login = null;
      dlg.close();
    } else if (res.status === "EXPIRED" || res.status === "INVALID") {
      expired();
    }
    // PENDING эсвэл түр алдаа бол дараагийн удаа дахин шалгана
  }

  function tick() {
    if (!login) return;
    const left = remaining(login.expiresAt, Date.now());
    if (left === "0:00") { expired(); return; }
    status.textContent = "SMS ирэхийг хүлээж байна. Үлдсэн хугацаа " + left;
  }

  btn.addEventListener("click", async () => {
    if (!api.user) { openPhoneStep(); return; }
    btn.disabled = true;
    await sb.auth.signOut();
    btn.disabled = false;
  });

  // 1-р алхам: код үүсгэж, SMS илгээх зааврыг харуулна
  phoneForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const n = phone(phoneInput.value);
    if (!n) { showError(errorText("bad_phone")); phoneInput.focus(); return; }
    showError("");
    phoneForm.querySelectorAll("button, input").forEach((x) => { x.disabled = true; });
    const res = await call("login-start", { phone: n });
    phoneForm.querySelectorAll("button, input").forEach((x) => { x.disabled = false; });
    if (res.error || !res.loginId) { showError(errorText(res.error)); return; }

    login = res;
    codeText.textContent = res.code;
    smsLink.href = res.smsUri;
    smsLink.hidden = false;
    backBtn.textContent = "Дугаар солих";
    phoneForm.hidden = true;
    wait.hidden = false;
    tick();
    let n3 = 0;
    timer = setInterval(() => {
      tick();
      n3 += 1;
      if (n3 % 3 === 0) check(); // секунд тутам цаг, 3 секунд тутам шалгана
    }, POLL_MS / 3);
    smsLink.focus();
  });

  api.open = openPhoneStep; // бусад хэсэг (№8) нэвтрэх цонхыг нээнэ
  backBtn.addEventListener("click", openPhoneStep);
  dlg.querySelectorAll("[data-auth-close]").forEach((b) => b.addEventListener("click", () => dlg.close()));
  dlg.addEventListener("close", () => { stop(); login = null; });

  // Нэвтрэлт өөрчлөгдөх бүрд (нэвтрэх, гарах, хуудсыг дахин нээх) товчийг шинэчилнэ
  sb.auth.onAuthStateChange((_event, session) => setUser(session ? session.user : null));
  btn.hidden = false;
})(this);
