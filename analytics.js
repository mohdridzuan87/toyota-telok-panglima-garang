// Google Analytics 4 (akaun Wan Jasni, G-W5FJCRQX92). Hanya aktif di wanjasni.my supaya ujian tempatan tak dikira.
// Klik butang WhatsApp & TikTok dikira sebagai acara sendiri — pautan & mesej WhatsApp TIDAK dihantar kepada Google.
(() => {
  const ID = "G-W5FJCRQX92";
  if (!/(^|\.)wanjasni\.my$/.test(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement("script");
  s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);

  // Di mana butang itu ditekan (nama kawasan sahaja)
  const area = a => a.id === "rSend" ? "kalkulator" : a.id === "mAsk" ? "kad_model"
    : a.closest(".float-wa") || a.classList.contains("float-wa") ? "butang_terapung"
    : a.closest("header") ? "atas" : a.closest("footer") ? "bawah" : a.closest(".sa-card") ? "kad_wan"
    : a.closest(".mx-view") ? "maxcheck" : a.closest(".pick, .pick-res") ? "pilih_model" : a.closest(".p-cta, .p-actions") ? "halaman_harga" : "lain";
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.classList.contains("mx-wa-share")) return; // pelawat kongsi kepada orang lain
    const h = a.href;
    const name = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(h) ? "whatsapp_click"
      : /^https:\/\/(www\.)?tiktok\.com\//.test(h) ? "tiktok_click" : "";
    if (name) gtag("event", name, { button_area: area(a), page_path: location.pathname });
  }, true);
})();
