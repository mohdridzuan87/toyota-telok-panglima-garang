// Tema Racing sahaja (<html class="theme-racing">):
// 1) "TOYOTA" hero meregang naik huruf demi huruf; 2) kereta hero meluncur masuk dengan kabur gerakan setiap kali bertukar;
// 3) dua jalur petikan gelap (gambar kereta merah rasmi Toyota, kabur laju) dengan petikan gergasi bergerak mendatar ikut skrol;
// 4) kandungan muncul lembut ikut skrol. Tanpa JS: laman kekal lengkap & boleh dibaca.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("theme-racing")) return;
  const EN = root.lang === "en", BASE = window.SITE_BASE || "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1) huruf hero meregang */
  const h1 = document.querySelector(".hero h1");
  if (h1 && !reduce) {
    const t = h1.firstChild;
    if (t && t.nodeType === 3) {
      const frag = document.createDocumentFragment();
      [...t.textContent].forEach((ch, i) => { const s = document.createElement("span"); s.className = "r-ch"; s.textContent = ch; s.style.animationDelay = (0.08 + i * 0.07) + "s"; frag.appendChild(s); });
      h1.setAttribute("aria-label", h1.innerText.replace(/\s+/g, " ").trim());
      t.replaceWith(frag);
    }
  }

  /* 2) kereta hero meluncur masuk (setiap kali model hero bertukar) */
  const car = document.getElementById("heroCar");
  if (car && !reduce) {
    const go = () => { car.classList.remove("r-in"); void car.offsetWidth; car.classList.add("r-in"); };
    go();
    new MutationObserver(m => { if (m.some(x => x.attributeName === "src")) go(); }).observe(car, { attributes: true, attributeFilter: ["src"] });
  }

  /* 3) jalur petikan */
  const D = window.TOYOTA;
  const reds = [];
  if (D && D.models) {
    const pref = ["camry", "gr-yaris", "corolla-cross", "vios", "yaris-cross", "harrier"];
    const ms = [...D.models].sort((a, b) => (pref.indexOf(a.id) + 99) % 99 - (pref.indexOf(b.id) + 99) % 99);
    for (const m of ms) {
      const c = (m.grades || []).flatMap(g => g.cols || []).find(c => c.img && !c.illus && !c.src && /red|scarlet|merah|crimson|emotional/i.test(c.n));
      if (c && !reds.some(r => r.m === m.id)) reds.push({ m: m.id, img: BASE + c.img });
      if (reds.length >= 2) break;
    }
  }
  const BANDS = EN
    ? [{ before: "#model", html: "Prices straight <b>from Toyota</b> &nbsp;·&nbsp;" }, { before: "#proses", html: "One person, <b>sorts it all</b> &nbsp;·&nbsp;" }]
    : [{ before: "#model", html: "Harga terus <b>dari Toyota</b> &nbsp;·&nbsp;" }, { before: "#proses", html: "Satu orang, <b>settle semua</b> &nbsp;·&nbsp;" }];
  const bands = [];
  BANDS.forEach((b, i) => {
    const at = document.querySelector(b.before); if (!at) return;
    const s = document.createElement("section");
    s.className = "r-band"; s.setAttribute("aria-hidden", "true");
    const img = reds[i % Math.max(1, reds.length)];
    s.innerHTML = `<div class="r-band-pin">${img ? `<div class="r-band-bg"><img src="${img.img}" alt="" loading="lazy"></div>` : ""}<div class="r-band-txt">${b.html}</div><div class="r-band-swoosh"></div></div>`;
    at.parentNode.insertBefore(s, at);
    bands.push({ s, txt: s.querySelector(".r-band-txt"), bg: s.querySelector(".r-band-bg") });
  });

  /* 4) kemunculan lembut */
  const els = [...document.querySelectorAll(".sec .wrap > *, .trust-item")];
  els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) el.classList.add("r-rise"); });

  let raf = 0;
  const frame = () => {
    raf = 0;
    if (!reduce) for (const b of bands) {
      const r = b.s.getBoundingClientRect(), len = r.height - innerHeight;
      if (r.bottom < 0 || r.top > innerHeight || len <= 0) continue;
      const p = Math.min(1, Math.max(0, -r.top / len));
      // petikan masuk dari kanan & keluar ke kiri; gambar bergerak perlahan arah bertentangan (parallax)
      b.txt.style.transform = `translate3d(${(-p * b.txt.scrollWidth).toFixed(1)}px,0,0)`;
      if (b.bg) b.bg.style.transform = `translate3d(${(p * 12 - 6).toFixed(2)}%,0,0)`;
    }
    for (const el of els) if (el.classList.contains("r-rise") && !el.classList.contains("in") && el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add("in");
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
  addEventListener("resize", frame);
  setInterval(frame, 500);
  frame();
})();
