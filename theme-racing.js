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
      // bungkus huruf dalam satu span "r-word" (nowrap) supaya perkataan tak patah antara huruf di skrin lebar
      const frag = document.createElement("span"); frag.className = "r-word";
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

  /* 3b) BARISAN MODEL: seksyen melekat, kad bertab bergerak MENDATAR ikut skrol menegak (ala garis masa laman pelumba) */
  let track = null;
  if (D && D.models && D.models.length) {
    const rm = n => "RM" + Math.round(n).toLocaleString("en-MY");
    const T = EN ? { eye: "The line-up", h: "Every Toyota, <b>one road.</b>", from: "From", go: "View" } : { eye: "Barisan Toyota", h: "Semua Toyota, <b>satu jalan.</b>", from: "Dari", go: "Lihat" };
    const s = document.createElement("section");
    s.className = "r-track";
    s.innerHTML = `<div class="r-track-pin"><div class="wrap r-track-head"><p class="eyebrow">${T.eye}</p><h2>${T.h}</h2></div>
      <div class="r-track-row">${D.models.map((m, i) => { const p = Math.min(...m.grades.map(g => g.price));
        return `<button type="button" class="r-card" data-id="${m.id}"><span class="r-tab">${m.type}</span><span class="r-num">${String(i + 1).padStart(2, "0")}</span>
          <img src="${BASE + m.cut}" alt="Toyota ${m.name}" loading="lazy"><strong>${m.name}</strong><em>${T.from} ${rm(p)}*</em><span class="r-go">${T.go} →</span></button>`; }).join("")}</div>
      <div class="r-track-bar"><i></i></div></div>`;
    const at = document.querySelector(".trust");
    if (at) {
      at.parentNode.insertBefore(s, at.nextSibling);
      const row = s.querySelector(".r-track-row"), bar = s.querySelector(".r-track-bar i");
      const size = () => { s.style.height = (row.scrollWidth - innerWidth + innerHeight + 40) + "px"; };
      size(); addEventListener("resize", size); addEventListener("load", size);
      s.addEventListener("click", e => {
        const c = e.target.closest(".r-card"); if (!c) return;
        const tab = document.querySelector(`#modelTabs button[data-id="${c.dataset.id}"]`); if (tab) tab.click();
        const tgt = document.getElementById("model");
        if (window.__lenis) window.__lenis.scrollTo(tgt.getBoundingClientRect().top + scrollY - 70); else tgt.scrollIntoView({ behavior: "smooth" });
      });
      track = { s, row, bar };
    }
  }

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
    if (track && !reduce) {
      const r = track.s.getBoundingClientRect(), len = r.height - innerHeight;
      if (r.bottom > 0 && r.top < innerHeight && len > 0) {
        const p = Math.min(1, Math.max(0, -r.top / len));
        track.row.style.transform = `translate3d(${(-p * (track.row.scrollWidth - innerWidth + 40)).toFixed(1)}px,0,0)`;
        track.bar.style.transform = `scaleX(${p.toFixed(3)})`;
      }
    }
    for (const el of els) if (el.classList.contains("r-rise") && !el.classList.contains("in") && el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add("in");
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
  addEventListener("resize", frame);
  setInterval(frame, 500);
  frame();

  /* 5) SKROL LICIN ala laman pelumba (Lenis 1.1.13 dari jsDelivr) — tetikus/trackpad sahaja; telefon kekal skrol asli */
  if (!reduce) {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"; sc.async = true;
    sc.onload = () => {
      if (!window.Lenis) return;
      const lenis = new window.Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      window.__lenis = lenis; root.classList.add("r-smooth");
      lenis.on("scroll", () => { if (!raf) raf = requestAnimationFrame(frame); });
      const loop = t => { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
      // pautan dalam laman (#kalkulator dll.) pun meluncur licin
      document.addEventListener("click", e => { const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute("href").length < 2) return;
        const t = document.querySelector(a.getAttribute("href")); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); });
    };
    document.head.appendChild(sc);
  }
})();
