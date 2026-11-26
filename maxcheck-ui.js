// Seksyen "Maxcheck": pilih model -> pilih varian (ikut kod model) -> terus nampak jadual service berkala rasmi.
// Data & gambar: maxcheck/data.js + maxcheck/img (dijana scripts/maxcheck.py setiap 7 hari). Tak perlu download PDF.
(() => {
  const M = window.MAXCHECK, sec = document.getElementById("maxcheck");
  if (!M || !sec) return;
  const BASE = "/maxcheck/", root = document.documentElement;
  let EN = !root.classList.contains("bm");
  const texts = () => EN ? {
    cats: { "SEDAN": "Sedan", "SUV": "SUV", "MPV": "MPV", "PICKUP & VAN": "Pickup & Van", "HATCHBACK": "Hatchback", "GR LINEUP": "GR lineup", "HYBRID ELECTRIC": "Hybrid Electric", "OTHERS": "Others" },
    variant: "Choose your variant (check the model code in your vehicle grant)", code: "Code", noteFor: "for",
    zoom: "Zoom in", fit: "Fit to screen", full: "Full screen", close: "Close",
    swipe: "Swipe left and right to see the part names and prices.", eff: d => `Effective ${d}`,
    wa: n => `Hi Wan Jasni, I'd like to ask about Maxcheck service for my Toyota ${n}.`, ask: "Ask Wan Jasni",
    month: d => d,
    alt: (m, v) => `Toyota ${m} Maxcheck periodic service schedule, ${v}`,
    date: iso => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  } : {
    cats: { "SEDAN": "Sedan", "SUV": "SUV", "MPV": "MPV", "PICKUP & VAN": "Pickup & Van", "HATCHBACK": "Hatchback", "GR LINEUP": "GR lineup", "HYBRID ELECTRIC": "Hybrid Electric", "OTHERS": "Lain-lain" },
    variant: "Pilih varian kereta awak (tengok kod model dalam geran)", code: "Kod", noteFor: "untuk",
    zoom: "Besarkan", fit: "Muat skrin", full: "Skrin penuh", close: "Tutup",
    swipe: "Leret ke kiri dan kanan untuk tengok nama parts & harga.", eff: d => `Berkuat kuasa ${d}`,
    wa: n => `Salam Wan Jasni, saya nak tanya pasal service Maxcheck untuk Toyota ${n}.`, ask: "Tanya Wan Jasni",
    month: d => d.replace(/January|February|March|May|June|July|August|October|December/, x => ({ January: "Januari", February: "Februari", March: "Mac", May: "Mei", June: "Jun", July: "Julai", August: "Ogos", October: "Oktober", December: "Disember" })[x]),
    alt: (m, v) => `Jadual service berkala Maxcheck Toyota ${m}, ${v}`,
    date: iso => new Date(iso + "T00:00:00Z").toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  };
  let T = texts();
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const all = M.groups.flatMap(g => g.models);
  const list = sec.querySelector("#mxList"), view = sec.querySelector("#mxView");

  const renderList = () => {
    list.innerHTML = M.groups.map(g => `<div class="mx-group"><h3>${esc(T.cats[g.name] || g.name)}</h3><div class="mx-models">${g.models.map(m => `<button type="button" data-id="${m.id}" aria-expanded="false">${esc(m.name)}</button>`).join("")}</div></div>`).join("");
  };
  renderList();
  const chk = sec.querySelector("#mxChecked"); if (chk) chk.textContent = T.date(M.checkedAt);

  let cur = null, page = 0, zoom = matchMedia("(max-width:760px)").matches;
  const frame = () => view.querySelector(".mx-frame");
  function render() {
    const m = cur, p = m.pages[page];
    view.hidden = false;
    view.innerHTML = `<div class="mx-head"><div><p class="mx-kicker">Maxcheck${p.code ? ` · ${T.code} ${esc(p.code)}` : ""}</p><h3>Toyota ${esc(m.name)}</h3><p class="mx-eff">${m.effective ? esc(T.eff(T.month(m.effective))) : ""}</p></div>
        <button type="button" class="mx-close" aria-label="${T.close}">✕</button></div>
      ${m.pages.length > 1 ? `<p class="mx-pick">${T.variant}</p><div class="mx-variants">${m.pages.map((x, i) => `<button type="button" data-page="${i}" class="${i === page ? "on" : ""}">${esc(x.label)}${x.code || x.note ? `<small>${esc(x.code)}${x.note ? ` · ${T.noteFor} ${esc(T.month(x.note))}` : ""}</small>` : ""}</button>`).join("")}</div>` : `<p class="mx-pick"><b>${esc(p.label)}</b></p>`}
      <div class="mx-tools"><button type="button" class="mx-zoom">${zoom ? T.fit : T.zoom}</button><button type="button" class="mx-full">${T.full}</button>
        <a class="p-btn p-wa mx-wa" target="_blank" rel="noopener" href="https://wa.me/60163313607?text=${encodeURIComponent(T.wa(m.name))}">${T.ask}</a></div>
      <div class="mx-frame${zoom ? " zoomed" : ""}" tabindex="0"><img src="${BASE + p.img}" width="${p.w}" height="${p.h}" alt="${esc(T.alt(m.name, p.label))}"></div>
      <p class="mx-hint">${T.swipe}</p>`;
    start();
  }
  // di telefon (dibesarkan): mula di lajur pakej Maxcheck supaya jarak service terus nampak
  const start = () => { const f = frame(); if (!f) return; const img = f.querySelector("img"); const go = () => { f.scrollLeft = zoom ? Math.max(0, img.clientWidth * 0.39) : 0; }; if (img.complete) go(); else img.addEventListener("load", go, { once: true }); };
  function open(id, scroll = true) {
    const m = all.find(x => x.id === id); if (!m) return;
    cur = m; page = 0; render();
    history.replaceState(null, "", location.pathname + "?" + (EN ? "" : "lang=bm&") + "model=" + m.id);
    list.querySelectorAll("button").forEach(b => { const on = b.dataset.id === id; b.classList.toggle("on", on); b.setAttribute("aria-expanded", on ? "true" : "false"); });
    if (scroll) {
      // tunggu gambar siap dahulu, supaya skrol tidak terhenti separuh jalan
      const im = view.querySelector(".mx-frame img"); let done = false;
      const go = () => { if (done) return; done = true; start(); requestAnimationFrame(() => view.scrollIntoView({ behavior: "smooth", block: "start" })); };
      if (im.complete) go(); else { im.addEventListener("load", go, { once: true }); setTimeout(go, 1500); }
    }
  }
  list.addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (b) open(b.dataset.id); });
  view.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.page !== undefined) { page = +t.dataset.page; render(); return; }
    if (t.classList.contains("mx-zoom")) { zoom = !zoom; frame().classList.toggle("zoomed", zoom); t.textContent = zoom ? T.fit : T.zoom; start(); return; }
    if (t.classList.contains("mx-close")) { history.replaceState(null, "", location.pathname + (EN ? "" : "?lang=bm")); view.hidden = true; view.innerHTML = ""; list.querySelectorAll("button").forEach(b => { b.classList.remove("on"); b.setAttribute("aria-expanded", "false"); }); return; }
    if (t.classList.contains("mx-full")) fullscreen();
  });
  view.addEventListener("click", e => { if (e.target.tagName === "IMG" && e.target.closest(".mx-frame")) fullscreen(); });

  function fullscreen() {
    const p = cur.pages[page];
    const o = document.createElement("div"); o.className = "mx-overlay"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    o.innerHTML = `<button type="button" class="mx-ov-close">✕ ${T.close}</button><div class="mx-ov-scroll"><img src="${BASE + p.img}" alt="${esc(T.alt(cur.name, p.label))}" width="${p.w}" height="${p.h}"></div>`;
    const done = () => { o.remove(); document.documentElement.classList.remove("mx-lock"); removeEventListener("keydown", key); };
    const key = e => { if (e.key === "Escape") done(); };
    o.querySelector(".mx-ov-close").addEventListener("click", done);
    addEventListener("keydown", key);
    document.documentElement.classList.add("mx-lock");
    document.body.appendChild(o);
    o.querySelector(".mx-ov-close").focus();
  }

  // butang BM | EN: tukar bahasa di halaman yang sama
  const titles = { en: document.title, bm: "" };
  titles.en = `Toyota Maxcheck Service Schedule ${new Date(M.checkedAt).getFullYear()} for Every Model | Wan Jasni`;
  titles.bm = `Jadual Service Maxcheck Toyota ${new Date(M.checkedAt).getFullYear()} Setiap Model | Wan Jasni`;
  const langBtns = [...document.querySelectorAll(".p-lang a[data-lang]")];
  const markLang = () => langBtns.forEach(a => { if (a.dataset.lang === (EN ? "en" : "bm")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const urlFor = () => { const q = new URLSearchParams(); if (!EN) q.set("lang", "bm"); if (cur && !view.hidden) q.set("model", cur.id); const s = q.toString(); return location.pathname + (s ? "?" + s : ""); };
  langBtns.forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    EN = a.dataset.lang === "en"; T = texts();
    root.classList.toggle("bm", !EN); root.lang = EN ? "en" : "ms"; document.title = EN ? titles.en : titles.bm;
    renderList(); markLang();
    if (cur && !view.hidden) { render(); list.querySelector(`button[data-id="${cur.id}"]`)?.classList.add("on"); }
    history.replaceState(null, "", urlFor());
  }));
  markLang();

  // pautan terus: /maxcheck/?model=vios (boleh tambah &lang=bm)
  const q = new URLSearchParams(location.search), want = q.get("model") || q.get("maxcheck");
  if (want) { open(want, false); if (!view.hidden) requestAnimationFrame(() => view.scrollIntoView({ behavior: "auto", block: "start" })); }
})();
