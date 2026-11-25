// Tema Apple sahaja (<html class="theme-apple">): seksyen "Lihat lebih dekat" ala halaman produk apple.com.
// Seksyen melekat (sticky) — skrol menukar warna kereta guna gambar warna rasmi Toyota Malaysia (data.js),
// kereta masuk & membesar, latar bercahaya ikut warna. Tanpa JS / tema lain: seksyen ini tidak wujud.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("theme-apple")) return;
  const D = window.TOYOTA; if (!D || !D.models) return;
  const EN = root.lang === "en", BASE = window.SITE_BASE || "";
  const T = EN
    ? { eye: "Colours", h: "Take a closer look.", sub: "Scroll to see every colour, straight from Toyota Malaysia's official pictures.", cta: "Calculate instalment", ask: "Ask Wan Jasni about stock", extra: p => `+RM${p.toLocaleString("en-MY")}` }
    : { eye: "Warna", h: "Lihat lebih dekat.", sub: "Skrol untuk tengok setiap warna, terus dari gambar rasmi Toyota Malaysia.", cta: "Kira ansuran", ask: "Tanya stok dengan Wan Jasni", extra: p => `+RM${p.toLocaleString("ms-MY")}` };

  // Model pameran: pilih varian dengan paling banyak gambar warna (utamakan Corolla Cross)
  const pickGrade = m => (m.grades || []).map(g => ({ g, cols: (g.cols || []).filter(c => c.img && !c.illus) })).sort((a, b) => b.cols.length - a.cols.length)[0];
  const order = ["corolla-cross", "yaris-cross", "vios", "camry", "zenix"];
  let pick = null;
  for (const id of order) { const m = D.models.find(x => x.id === id); const p = m && pickGrade(m); if (p && p.cols.length >= 3) { pick = { m, ...p }; break; } }
  if (!pick) return;
  const cols = pick.cols.slice(0, 6), n = cols.length;

  const sec = document.createElement("section");
  sec.className = "ap-show"; sec.style.setProperty("--n", n);
  sec.innerHTML = `<div class="ap-pin">
    <div class="ap-glow"></div>
    <div class="wrap ap-head"><p class="eyebrow">${T.eye}</p><h2>${T.h}</h2><p class="sub">${T.sub}</p></div>
    <div class="ap-stage">${cols.map((c, i) => `<img src="${BASE + c.img}" alt="Toyota ${pick.m.name} ${c.n}" ${i ? 'loading="lazy"' : ""} data-i="${i}">`).join("")}</div>
    <div class="wrap ap-foot">
      <div class="ap-name"><strong>${pick.g.name}</strong><span id="apCol"></span></div>
      <div class="ap-dots" role="group" aria-label="${T.eye}">${cols.map((c, i) => `<button type="button" data-i="${i}" style="--c:${c.hex}" aria-label="${c.n}"></button>`).join("")}</div>
      <div class="ap-cta"><a class="btn btn-red" href="#kalkulator" id="apCalc">${T.cta}</a></div>
    </div>
  </div>`;
  const anchor = document.querySelector("#model");
  if (!anchor) return;
  anchor.parentNode.insertBefore(sec, anchor);

  const imgs = [...sec.querySelectorAll(".ap-stage img")], dots = [...sec.querySelectorAll(".ap-dots button")];
  const glow = sec.querySelector(".ap-glow"), lbl = sec.querySelector("#apCol"), stage = sec.querySelector(".ap-stage");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = -1;
  const setCol = i => {
    if (i === cur) return; cur = i;
    imgs.forEach((im, k) => im.classList.toggle("on", k === i));
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
    const c = cols[i]; lbl.textContent = c.n + (c.p ? ` · ${T.extra(c.p)}` : "");
    glow.style.setProperty("--c", c.hex);
  };
  // Kemajuan skrol dalam seksyen: 0 -> 1. 15% pertama = kereta masuk; selebihnya dibahagi sama rata ikut warna.
  const prog = () => { const r = sec.getBoundingClientRect(), len = r.height - innerHeight; return len > 0 ? Math.min(1, Math.max(0, -r.top / len)) : 0; };
  let raf = 0;
  const frame = () => {
    raf = 0; const p = prog();
    if (!reduce) {
      const e = Math.min(1, p / 0.15), ease = 1 - Math.pow(1 - e, 3);
      stage.style.transform = `translateX(${((1 - ease) * 28).toFixed(2)}%) scale(${(0.78 + ease * 0.22).toFixed(3)})`;
      stage.style.opacity = (0.25 + ease * 0.75).toFixed(3);
    }
    const q = Math.max(0, (p - 0.15) / 0.85);
    setCol(Math.min(n - 1, Math.floor(q * n)));
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
  addEventListener("resize", frame);
  // Tekan bulatan warna: skrol ke kedudukan warna itu
  dots.forEach((d, i) => d.addEventListener("click", () => {
    const r = sec.getBoundingClientRect(), len = r.height - innerHeight, top = scrollY + r.top;
    scrollTo({ top: top + len * (0.15 + 0.85 * (i + 0.5) / n), behavior: reduce ? "auto" : "smooth" });
  }));
  // Butang kira ansuran: buka kalkulator dengan model & warna yang sedang dipapar
  sec.querySelector("#apCalc").addEventListener("click", () => {
    const btn = document.querySelector(`#cModels button[data-id="${pick.m.id}"]`); if (btn) btn.click();
  });
  frame();
})();
