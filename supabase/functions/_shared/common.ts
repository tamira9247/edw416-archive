// №6: login-start, login-check функцуудын нийтлэг хэсэг.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Хөтчөөс дуудаж болох хаягууд (GitHub Pages, дотоод сервер)
const ORIGINS = [
  "https://tamira9247.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export const VERIFY_API = "https://api.verify.mn";
export const SHORTCODE = "144773";

// Дотоод Supabase дээр ажиллаж байна уу. Дотоодод verify.mn руу хандахгүй
const url = Deno.env.get("SUPABASE_URL") ?? "";
export const LOCAL = /^http:\/\/(kong|127\.0\.0\.1|localhost)[:/]/.test(url);

// Дотоодын тест дугаарууд (seed.sql). Зөвхөн LOCAL үед шууд баталгаажна
export const TEST_PHONES = new Set(["99000001", "99000002", "99000009"]);

// service_role эрхтэй клиент. Зөвхөн функц дотор, хөтөч рүү хэзээ ч гарахгүй
export const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { autoRefreshToken: false, persistSession: false },
});

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
  if (ORIGINS.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

// OPTIONS (CORS) болон POST биш хүсэлтийг шийднэ. Шийдсэн бол Response буцаана
export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  return null;
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}
