// Tema Stripe: hanya berjalan bila <html class="theme-stripe">. Tukar tajuk HURUF BESAR -> huruf ayat,
// dan kemunculan lembut (kandungan tetap kelihatan jika skrip gagal).
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("theme-stripe")) return;
  const KEEP = ["Toyota", "Wan Jasni", "Telok Panglima Garang", "Kuala Langat", "HEV", "WhatsApp", "Semenanjung", "Malaysia", "GR"];
  const fix = s => { for (const k of KEEP) s = s.replace(new RegExp("\\b" + k + "\\b", "gi"), k); return s; };
  const sentence = el => {
    let first = true;
    const walk = node => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          if (!/\S/.test(n.textContent)) continue;
          let s = n.textContent.toLowerCase();
          if (first) { s = s.replace(/\S/, c => c.toUpperCase()); first = false; }
          n.textContent = fix(s);
        } else if (n.nodeType === 1) walk(n);
      }
    };
    walk(el);
  };
  // Hanya tajuk yang ditulis HURUF BESAR (elakkan nama model seperti "Toyota Vios")
  const isCaps = el => { const t = el.textContent.replace(/[^A-Za-z]/g, ""); return t.length > 2 && t === t.toUpperCase(); };
  document.querySelectorAll(".hero h1, .sec h2, .pick-empty h3, .check-card h3").forEach(el => { if (isCaps(el)) sentence(el); });

  const els = [...document.querySelectorAll(".sec .wrap > *, .trust-item")];
  els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) el.classList.add("rise"); });
  const show = () => els.forEach(el => { if (el.getBoundingClientRect().top < innerHeight * 0.95) el.classList.add("in"); });
  addEventListener("scroll", show, { passive: true });
  setInterval(show, 400);
  show();
})();
