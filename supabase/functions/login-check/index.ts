// №6, 2-р алхам: verify.mn-ээс SMS ирсэн эсэхийг шалгана. Ирсэн бол оюутны хаягийг
// олж (анх удаа бол үүсгэж), нэг удаагийн нэвтрэх токен буцаана.
// Оролт: { loginId }
// Гаралт: { status: "PENDING" | "EXPIRED" | "INVALID" } эсвэл { status: "VERIFIED", tokenHash }
import { admin, body, json, LOCAL, preflight, VERIFY_API } from "../_shared/common.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// generateLink имэйлээр ажилладаг тул хэрэглэгч бүрд дотоод хаяг өгнө.
// .invalid домэйн тул ямар ч имэйл илгээгдэхгүй
const emailFor = (phone: string) => `${phone}@edw416.invalid`;

// verify.mn-ээс session-ий төлөв: PENDING, VERIFIED, EXPIRED
async function verifyStatus(sessionId: string): Promise<string | null> {
  if (LOCAL) return "VERIFIED";
  const key = Deno.env.get("VERIFY_API_KEY");
  if (!key) return null;
  const r = await fetch(`${VERIFY_API}/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { "Authorization": `Bearer ${key}` },
  }).catch(() => null);
  if (!r || !r.ok) {
    console.error("verify.mn GET /sessions", r?.status);
    return null;
  }
  const v = await r.json();
  return typeof v.sessionStatus === "string" ? v.sessionStatus : null;
}

// Дугаартай оюутныг олно, байхгүй бол үүсгэнэ. students мөрийг trigger үүсгэнэ
async function ensureUser(phone: string): Promise<string | null> {
  const email = emailFor(phone);
  const { data: s } = await admin.from("students").select("id").eq("phone", phone).maybeSingle();
  if (s) {
    const { error } = await admin.auth.admin.updateUserById(s.id, { email, email_confirm: true });
    if (error) console.error("updateUserById", error.message);
    return error ? null : email;
  }
  const { error } = await admin.auth.admin.createUser({
    phone: "976" + phone, phone_confirm: true, email, email_confirm: true,
  });
  if (error) console.error("createUser", error.message);
  return error ? null : email;
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const loginId = String((await body(req)).loginId ?? "");
  if (!UUID.test(loginId)) return json(req, { status: "INVALID" }, 400);

  const { data: row } = await admin.from("login_sessions")
    .select("id, phone, verify_session_id, expires_at, used_at")
    .eq("id", loginId).maybeSingle();
  if (!row || row.used_at) return json(req, { status: "INVALID" }, 404);
  if (new Date(row.expires_at).getTime() < Date.now()) return json(req, { status: "EXPIRED" });

  const status = await verifyStatus(row.verify_session_id);
  if (status === null) return json(req, { error: "verify_failed" }, 502);
  if (status !== "VERIFIED") return json(req, { status: status === "EXPIRED" ? "EXPIRED" : "PENDING" });

  // Нэг session-ийг ганц удаа ашиглана (зэрэг ирсэн хоёр хүсэлтээс нэг нь л өнгөрнө)
  const { data: claimed } = await admin.from("login_sessions")
    .update({ used_at: new Date().toISOString() })
    .eq("id", loginId).is("used_at", null).select("id");
  if (!claimed || claimed.length !== 1) return json(req, { status: "INVALID" }, 404);

  const email = await ensureUser(row.phone);
  if (!email) return json(req, { error: "server" }, 500);

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !link?.properties?.hashed_token) {
    console.error("generateLink", error?.message);
    return json(req, { error: "server" }, 500);
  }
  return json(req, { status: "VERIFIED", tokenHash: link.properties.hashed_token });
});
