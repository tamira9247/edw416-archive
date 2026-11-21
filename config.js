// Supabase-ийн холболтын тохиргоо (BAIRSHUULALT.md, "Орчин солих дүрэм").
// Энд зөвхөн нийтийн утга (төслийн хаяг, publishable түлхүүр) бичнэ.
// service_role, secret түлхүүр, SMS-ийн API түлхүүрийг ХЭЗЭЭ Ч бичихгүй.
(function () {
  "use strict";

  // Дотоод Supabase (npx supabase start). Түлхүүр нь бүх дотоод төсөлд ижил демо утга, нууц биш
  const LOCAL = {
    url: "http://127.0.0.1:54321",
    key: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
  };

  // Үүлэн төсөл (Үе 4.2-т бөглөнө). Хоосон бол нэвтрэх товч харагдахгүй
  const CLOUD = {
    url: "https://wpatyvuogwcryfiqupgd.supabase.co",
    key: "sb_publishable_wBOUB0aRozfD7VQDmXFO9Q_OpRrQm1Z"
  };

  const host = location.hostname;
  window.CONFIG = host === "localhost" || host === "127.0.0.1" ? LOCAL : CLOUD;
})();
