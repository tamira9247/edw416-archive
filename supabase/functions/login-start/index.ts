// №6, 1-р алхам: дугаарт зориулж 6 оронтой код үүсгэж, verify.mn-д session нээнэ.
// Оюутан тэр кодыг өөрийн утаснаас 144773 руу SMS-ээр илгээнэ.
// Оролт: { phone: "99112233" }
// Гаралт: { loginId, code, shortcode, smsUri, expiresAt }
import { admin, body, json, LOCAL, preflight, SHORTCODE, TEST_PHONES, VERIFY_API } from "../_shared/common.ts";

// Нэг дугаараас 10 минутад хамгийн ихдээ хэдэн оролдлого
const MAX_TRIES = 5;

function randomCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const phone = String((await body(req)).phone ?? "");
  if (!/^[0-9]{8}$/.test(phone)) return json(req, { error: "bad_phone" }, 400);

  // Давтамжийн хязгаар
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin.from("login_sessions")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone).gte("created_at", since);
  if ((count ?? 0) >= MAX_TRIES) return json(req, { error: "too_many" }, 429);

  const code = randomCode();
  let sessionId: string;
  let expiresAt: string;
  let smsUri = `sms:${SHORTCODE}?body=${code}`;

  if (LOCAL) {
    // Дотоодод зөвхөн тест дугаар, verify.mn руу хандахгүй
    if (!TEST_PHONES.has(phone)) return json(req, { error: "local_test_only" }, 400);
    sessionId = "local-" + crypto.randomUUID();
    expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  } else {
    const key = Deno.env.get("VERIFY_API_KEY");
    if (!key) return json(req, { error: "not_configured" }, 500);
    const r = await fetch(`${VERIFY_API}/sessions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ phone, text: code }),
    }).catch(() => null);
    if (!r || !r.ok) {
      console.error("verify.mn POST /sessions", r?.status, r ? await r.text() : "сүлжээ");
      return json(req, { error: "verify_failed" }, 502);
    }
    const v = await r.json();
    sessionId = String(v.sessionId);
    expiresAt = String(v.expiresAt);
    if (typeof v.smsUri === "string" && v.smsUri.startsWith("sms:")) smsUri = v.smsUri;
  }

  const { data, error } = await admin.from("login_sessions")
    .insert({ phone, verify_session_id: sessionId, code, expires_at: expiresAt })
    .select("id").single();
  if (error) {
    console.error("login_sessions insert", error.message);
    return json(req, { error: "server" }, 500);
  }

  return json(req, { loginId: data.id, code, shortcode: SHORTCODE, smsUri, expiresAt });
});
