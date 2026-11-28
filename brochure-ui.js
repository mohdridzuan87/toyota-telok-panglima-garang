// /brochure/: kad model -> pilih varian -> e-brochure rasmi terus dipapar (gambar setiap muka surat).
// Skrin penuh: satu muka surat sekali, leret kiri/kanan, ikut telefon tegak atau melintang. Kongsi PDF Toyota ke WhatsApp.
// Data & gambar dari repo wanjasni-brochure (window.BROCHURES), dikemas kini setiap 10 hari oleh GitHub Actions.
(() => {
  const B = window.BROCHURES, BASE = window.BR_BASE || "", sec = document.getElementById("brochure");
  if (!sec) return;
  const list = sec.querySelector("#brList"), view = sec.querySelector("#brView"), root = document.documentElement;
  const TOYOTA = "https://www.toyota.com.my", SITE = "https://wanjasni.my/brochure/";
  let EN = !root.classList.contains("bm");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const bmMonth = d => d.replace(/January|February|March|May|June|July|August|October|December/, x => ({ January: "Januari", February: "Februari", March: "Mac", May: "Mei", June: "Jun", July: "Julai", August: "Ogos", October: "Oktober", December: "Disember" })[x]);
  const texts = () => EN ? {
    pick: "Choose a variant", pages: n => `${n} pages`, full: "Full screen", share: "Share PDF to WhatsApp", pdf: "Open PDF",
    close: "Close", zoom: "Zoom in", fit: "Fit", prev: "Previous page", next: "Next page", covers: "This e-brochure covers:",
    tapHint: "Tap any page to view it full screen. Turn your phone sideways for wide pages.",
    variants: n => n > 1 ? `${n} variants` : "1 e-brochure", updated: d => ` · Updated: ${d}`,
    failed: "The brochures could not be loaded. Check your connection and refresh, or open the Toyota Malaysia brochure page.",
    msg: (n, pdf, link) => `Toyota ${n} e-brochure (PDF, official from Toyota Malaysia):\n${pdf}\n\nView online: ${link}`,
    alt: (n, i, t) => `Toyota ${n} e-brochure, page ${i} of ${t}`
  } : {
    pick: "Pilih varian", pages: n => `${n} muka surat`, full: "Skrin penuh", share: "Kongsi PDF ke WhatsApp", pdf: "Buka PDF",
    close: "Tutup", zoom: "Besarkan", fit: "Muat skrin", prev: "Muka surat sebelum", next: "Muka surat seterusnya", covers: "E-brochure ni untuk:",
    tapHint: "Tekan mana-mana muka surat untuk tengok skrin penuh. Pusing telefon melintang untuk muka surat yang lebar.",
    variants: n => n > 1 ? `${n} varian` : "1 e-brochure", updated: d => ` · Dikemas kini: ${d}`,
    failed: "E-brochure tak dapat dimuatkan. Semak internet dan refresh, atau buka laman e-brochure Toyota Malaysia.",
    msg: (n, pdf, link) => `E-brochure Toyota ${n} (PDF rasmi dari Toyota Malaysia):\n${pdf}\n\nTengok terus: ${link}`,
    alt: (n, i, t) => `E-brochure Toyota ${n}, muka surat ${i} daripada ${t}`
  };
  let T = texts();
  if (!B || !B.models) { list.innerHTML = `<p class="p-note">${T.failed}</p>`; return; }
  const day = iso => { const d = new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); return EN ? d : bmMonth(d); };
  const WAICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3Z"/></svg>';
  const FULLICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/></svg>';
  const PDFICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l6 6v14H6V2Zm7 1.5V9h5.5L13 3.5ZM8 13v2h8v-2H8Zm0 4v2h6v-2H8Z"/></svg>';

  let cur = null, vi = 0;
  const doc = () => B.docs[cur.variants[vi].doc];
  const vname = v => v.names.join(" · ");
  const link = () => `${SITE}?${EN ? "" : "lang=bm&"}model=${cur.id}${cur.variants.length > 1 ? "&v=" + cur.variants[vi].id : ""}`;
  const setUrl = () => { const q = new URLSearchParams(); if (!EN) q.set("lang", "bm"); if (cur && !view.hidden) { q.set("model", cur.id); if (cur.variants.length > 1) q.set("v", cur.variants[vi].id); } const s = q.toString(); history.replaceState(null, "", location.pathname + (s ? "?" + s : "")); };

  function grid() {
    const chk = document.getElementById("brChecked"); if (chk && B.checkedAt) chk.textContent = T.updated(day(B.checkedAt));
    list.innerHTML = B.models.map(m => `<button type="button" class="br-card${cur && cur.id === m.id ? " on" : ""}" data-id="${esc(m.id)}" aria-expanded="${cur && cur.id === m.id ? "true" : "false"}">
      <span class="br-img">${m.thumb ? `<img src="${BASE + m.thumb}" alt="Toyota ${esc(m.name)}" width="480" height="576" loading="lazy">` : ""}</span>
      <b>${esc(m.name)}</b><small>${esc(m.type)} · ${T.variants(m.variants.length)}</small></button>`).join("");
  }
  function render() {
    const m = cur, v = m.variants[vi], d = doc(), n = d.pages.length;
    view.hidden = false;
    view.innerHTML = `<div class="mx-head"><div><p class="mx-kicker">E-brochure · ${T.pages(n)}${d.mb ? ` · PDF ${d.mb} MB` : ""}</p><h3>Toyota ${esc(m.name)}</h3></div>
        <button type="button" class="mx-close" aria-label="${T.close}">✕</button></div>
      ${m.variants.length > 1 ? `<p class="mx-pick">${T.pick}</p><div class="mx-variants">${m.variants.map((x, i) => `<button type="button" data-v="${i}" class="${i === vi ? "on" : ""}">${esc(vname(x))}</button>`).join("")}</div>`
        : `<p class="mx-pick"><b>${esc(vname(v))}</b></p>`}
      ${v.names.length > 1 ? `<p class="mx-covers">${T.covers} <b>${esc(v.names.join(" · "))}</b></p>` : ""}
      <div class="mx-share br-actions">
        <button type="button" class="br-full">${FULLICO}<span>${T.full}</span></button>
        <a class="mx-wa mx-wa-share" href="${esc("https://wa.me/?text=" + encodeURIComponent(T.msg(vname(v), TOYOTA + d.pdf, link())))}" target="_blank" rel="noopener">${WAICO}<span>${T.share}</span></a>
        <a class="br-pdf" href="${esc(TOYOTA + d.pdf)}" target="_blank" rel="noopener">${PDFICO}<span>${T.pdf}</span></a>
      </div>
      <p class="mx-hint br-hint">${T.tapHint}</p>
      <div class="br-pages">${d.pages.map((p, i) => `<button type="button" class="br-page" data-p="${i}"><img src="${BASE + p.img}" width="${p.w}" height="${p.h}" alt="${esc(T.alt(vname(v), i + 1, n))}" loading="${i < 2 ? "eager" : "lazy"}" decoding="async"><span>${i + 1} / ${n}</span></button>`).join("")}</div>`;
  }
  function open(id, v, scroll = true) {
    const m = B.models.find(x => x.id === id); if (!m) return;
    cur = m; vi = Math.max(0, m.variants.findIndex(x => x.id === v));
    list.querySelectorAll(".br-card").forEach(b => { const on = b.dataset.id === id; b.classList.toggle("on", on); b.setAttribute("aria-expanded", on ? "true" : "false"); });
    render(); setUrl();
    if (scroll) requestAnimationFrame(() => view.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  list.addEventListener("click", e => { const b = e.target.closest(".br-card"); if (b) open(b.dataset.id); });
  view.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.v !== undefined) { vi = +t.dataset.v; render(); setUrl(); return; }
    if (t.classList.contains("mx-close")) { view.hidden = true; view.innerHTML = ""; cur = null; grid(); setUrl(); return; }
    if (t.classList.contains("br-full")) { full(0); return; }
    if (t.classList.contains("br-page")) full(+t.dataset.p);
  });

  // ---------- skrin penuh: leret antara muka surat; tegak/melintang ikut telefon ----------
  function full(start) {
    const m = cur, v = m.variants[vi], d = doc(), n = d.pages.length;
    const o = document.createElement("div"); o.className = "br-ov"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    o.innerHTML = `<div class="br-ov-bar"><button type="button" class="br-ov-zoom">${T.zoom}</button><span class="br-ov-count" aria-live="polite"></span><button type="button" class="br-ov-close">✕ ${T.close}</button></div>
      <div class="br-ov-pager">${d.pages.map((p, i) => `<div class="br-ov-slide"><img src="${BASE + p.img}" width="${p.w}" height="${p.h}" alt="${esc(T.alt(vname(v), i + 1, n))}" loading="${Math.abs(i - start) < 2 ? "eager" : "lazy"}" decoding="async"></div>`).join("")}</div>
      <button type="button" class="br-ov-nav br-ov-prev" aria-label="${T.prev}">‹</button><button type="button" class="br-ov-nav br-ov-next" aria-label="${T.next}">›</button>`;
    const pager = o.querySelector(".br-ov-pager"), count = o.querySelector(".br-ov-count"), zb = o.querySelector(".br-ov-zoom");
    let idx = start, zoomed = false;
    const go = (i, smooth) => { idx = Math.max(0, Math.min(n - 1, i)); pager.scrollTo({ left: idx * pager.clientWidth, behavior: smooth ? "smooth" : "instant" }); show(); };
    const show = () => { count.textContent = `${idx + 1} / ${n}`; o.querySelector(".br-ov-prev").disabled = idx === 0; o.querySelector(".br-ov-next").disabled = idx === n - 1; };
    const unzoom = () => { if (!zoomed) return; zoomed = false; o.classList.remove("zoomed"); pager.children[idx].classList.remove("zoomed"); zb.textContent = T.zoom; };
    const zoom = pt => {
      const s = pager.children[idx];
      if (zoomed) { unzoom(); go(idx); return; }
      const img = s.querySelector("img"), r = img.getBoundingClientRect();
      const fx = pt ? (pt.x - r.left) / r.width : .5, fy = pt ? (pt.y - r.top) / r.height : .5;
      zoomed = true; o.classList.add("zoomed"); s.classList.add("zoomed"); zb.textContent = T.fit;
      requestAnimationFrame(() => { s.scrollLeft = img.offsetWidth * fx - s.clientWidth / 2; s.scrollTop = img.offsetHeight * fy - s.clientHeight / 2; });
    };
    let tick;
    pager.addEventListener("scroll", () => { if (zoomed) return; clearTimeout(tick); tick = setTimeout(() => { const i = Math.round(pager.scrollLeft / pager.clientWidth); if (i !== idx) { idx = i; show(); } }, 60); });
    pager.addEventListener("click", e => { if (e.target.tagName === "IMG") zoom({ x: e.clientX, y: e.clientY }); });
    zb.addEventListener("click", () => zoom());
    o.querySelector(".br-ov-prev").addEventListener("click", () => { unzoom(); go(idx - 1, true); });
    o.querySelector(".br-ov-next").addEventListener("click", () => { unzoom(); go(idx + 1, true); });
    const relayout = () => { if (!zoomed) go(idx); };   // telefon dipusing: kekal di muka surat yang sama
    const key = e => { if (e.key === "Escape") done(); else if (e.key === "ArrowRight") { unzoom(); go(idx + 1, true); } else if (e.key === "ArrowLeft") { unzoom(); go(idx - 1, true); } };
    const done = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); o.remove(); root.classList.remove("mx-lock"); removeEventListener("keydown", key); removeEventListener("resize", relayout); };
    o.querySelector(".br-ov-close").addEventListener("click", done);
    document.addEventListener("fullscreenchange", function fc() { if (!document.fullscreenElement && o.isConnected) { document.removeEventListener("fullscreenchange", fc); } });
    addEventListener("keydown", key); addEventListener("resize", relayout);
    root.classList.add("mx-lock"); document.body.appendChild(o);
    // skrin penuh sebenar (sorok bar pelayar) bila disokong; iPhone guna paparan tetap biasa
    if (o.requestFullscreen) o.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    requestAnimationFrame(() => go(start));
    o.querySelector(".br-ov-close").focus({ preventScroll: true });
  }

  // ---------- BM | EN di halaman sama ----------
  const year = new Date(B.checkedAt || Date.now()).getFullYear();
  const titles = { en: `Toyota e-Brochure ${year} Malaysia, Every Model | Wan Jasni`, bm: `E-Brochure Toyota ${year} Malaysia, Semua Model | Wan Jasni` };
  const langBtns = [...document.querySelectorAll(".p-lang a[data-lang]")];
  const markLang = () => {
    langBtns.forEach(a => { if (a.dataset.lang === (EN ? "en" : "bm")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.querySelectorAll(".p-top a.p-mx:not(.p-home)").forEach(a => a.setAttribute("href", a.getAttribute("href").split("?")[0] + (EN ? "" : "?lang=bm")));
    const home = document.querySelector(".p-top a.p-home"); if (home) home.setAttribute("href", EN ? "/en/" : "/");
  };
  langBtns.forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    EN = a.dataset.lang === "en"; T = texts();
    root.classList.toggle("bm", !EN); root.lang = EN ? "en" : "ms"; document.title = EN ? titles.en : titles.bm;
    markLang(); grid(); if (cur && !view.hidden) render(); setUrl();
  }));
  markLang(); grid();

  // pautan terus: /brochure/?model=vios&v=vios-hev (boleh tambah &lang=bm)
  const q = new URLSearchParams(location.search);
  if (q.get("model")) {
    open(q.get("model"), q.get("v"), false);
    if (cur) { const jump = () => view.scrollIntoView({ behavior: "instant", block: "start" }); if (document.readyState === "complete") setTimeout(jump, 80); else addEventListener("load", () => setTimeout(jump, 80)); }
  }
})();
