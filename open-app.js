// Pautan TikTok: di telefon/tablet Android, buka APP TikTok terus (bukan versi web dalam pelayar).
// - iPhone: pautan biasa (iOS sendiri hantar ke app TikTok jika dipasang).
// - Pelayar dalam app (TikTok, Facebook, Instagram, WebView) & Firefox: pautan biasa, supaya butang tak tersekat.
// - Tiada app TikTok: Android guna browser_fallback_url = profil TikTok versi web.
// Dimuat selepas analytics.js; klik masih dikira (analytics dengar dahulu dan baca pautan asal).
(() => {
  const ua = navigator.userAgent, uad = navigator.userAgentData;
  const inApp = /; wv\)|musical_ly|Bytedance|trill_|TikTok|FBAN|FBAV|FB_IAB|Instagram|Line\//i.test(ua);
  // skrin lipat/tablet Android dalam mod "desktop site" tidak menulis "Android": kesan daripada skrin sentuh tanpa tetikus
  const android = /Android/i.test(ua) || (!!uad && uad.platform === "Linux" && navigator.maxTouchPoints > 1 && matchMedia("(pointer: coarse) and (hover: none)").matches);
  if (!android || inApp || !/Chrome\/|SamsungBrowser\//.test(ua)) return;
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="https://www.tiktok.com/@"]');
    if (!a || e.defaultPrevented) return;
    e.preventDefault();
    const u = new URL(a.href);
    // tanpa "package": kedua-dua versi app TikTok (musically & trill) disahkan untuk www.tiktok.com
    const url = `intent://${u.host}${u.pathname}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(a.href)};end`;
    (window.wjOpen || (x => { location.href = x; }))(url);
  });
})();
