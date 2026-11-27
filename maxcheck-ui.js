// Penonton helaian rasmi untuk /maxcheck/ dan /pricelist/: pilih model -> pilih varian / jenis pembeli ->
// terus nampak helaian rasmi, boleh kongsi ke WhatsApp atau muat turun gambar berkualiti tinggi.
// Data & gambar: maxcheck/ (scripts/maxcheck.py) dan pricelist/ (scripts/pricelist.py), dikemas kini setiap minggu.
// Satu gambar WebP (±2800 px) setiap muka surat; JPEG untuk kongsi dibuat dalam telefon pelawat bila diminta.
(() => {
  const PL = !!window.PRICELIST; // halaman senarai harga
  const M = window.PRICELIST || window.MAXCHECK, sec = document.getElementById(PL ? "pricelist" : "maxcheck");
  if (!M || !sec) return;
  const BASE = PL ? "/pricelist/" : "/maxcheck/", SITE = "https://wanjasni.my", root = document.documentElement;
  let EN = !root.classList.contains("bm");
  const day = (loc, iso) => new Date(iso + "T00:00:00Z").toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const bmMonth = d => d.replace(/January|February|March|May|June|July|August|October|December/, x => ({ January: "Januari", February: "Februari", March: "Mac", May: "Mei", June: "Jun", July: "Julai", August: "Ogos", October: "Oktober", December: "Disember" })[x]);
  const texts = () => {
    const t = EN ? {
      variant: PL ? "Choose the buyer type" : "Choose your variant (check the model code in your vehicle grant)", code: "Code", noteFor: "for",
      zoom: "Zoom in", fit: "Fit to screen", full: "Full screen", close: "Close", rotate: "Rotate",
      swipe: PL ? "Swipe left and right to see every variant, price and colour." : "Swipe left and right to see the part names and prices.",
      eff: d => `Effective ${d}`, month: d => d, kicker: PL ? "Price list · Peninsular Malaysia" : "Maxcheck",
      types: { ip: "Individual", cp: "Company (private)", cc: "Company (commercial)", "ip+cp": "Individual & company (private)" },
      page: n => `page ${n}`, covers: "This price list covers:",
      alt: (m, v) => PL ? `Toyota ${m} official price list, ${v}` : `Toyota ${m} Maxcheck periodic service schedule, ${v}`,
      share: "Share to WhatsApp", download: "Download image", wait: "Preparing image…", again: "Tap again to share",
      saved: "Image downloaded. Attach it in WhatsApp.", openWa: "Open WhatsApp",
      inApp: "Image downloaded. Nothing there? If you're inside the TikTok app, open this page in Chrome or Safari.",
      failed: "The image could not be prepared. Check your connection and try again.",
      caption: (m, v, eff) => PL ? `Toyota ${m} official price list (Peninsular Malaysia), ${v}${eff ? `, effective ${eff}` : ""}. Prices may change.` : `Toyota ${m} Maxcheck service schedule, ${v}. Subject to change by Toyota.`,
      date: iso => day("en-GB", iso)
    } : {
      variant: PL ? "Pilih jenis pembeli" : "Pilih varian kereta awak (tengok kod model dalam geran)", code: "Kod", noteFor: "untuk",
      zoom: "Besarkan", fit: "Muat skrin", full: "Skrin penuh", close: "Tutup", rotate: "Pusing",
      swipe: PL ? "Leret ke kiri dan kanan untuk tengok semua varian, harga & warna." : "Leret ke kiri dan kanan untuk tengok nama parts & harga.",
      eff: d => `Berkuat kuasa ${d}`, month: bmMonth, kicker: PL ? "Senarai harga · Semenanjung" : "Maxcheck",
      types: { ip: "Individu", cp: "Syarikat (persendirian)", cc: "Syarikat (komersial)", "ip+cp": "Individu & syarikat (persendirian)" },
      page: n => `muka surat ${n}`, covers: "Senarai harga ni untuk:",
      alt: (m, v) => PL ? `Senarai harga rasmi Toyota ${m}, ${v}` : `Jadual service berkala Maxcheck Toyota ${m}, ${v}`,
      share: "Kongsi ke WhatsApp", download: "Download gambar", wait: "Sediakan gambar…", again: "Tekan sekali lagi untuk kongsi",
      saved: "Gambar dah di-download. Lampirkan dalam WhatsApp.", openWa: "Buka WhatsApp",
      inApp: "Gambar dah di-download. Tak jumpa? Kalau awak dalam app TikTok, buka halaman ni di Chrome atau Safari.",
      failed: "Gambar tak dapat disediakan. Semak internet dan cuba lagi.",
      caption: (m, v, eff) => PL ? `Senarai harga rasmi Toyota ${m} (Semenanjung), ${v}${eff ? `, berkuat kuasa ${eff}` : ""}. Harga boleh berubah.` : `Jadual service Maxcheck Toyota ${m}, ${v}. Tertakluk pada perubahan oleh Toyota.`,
      date: iso => day("ms-MY", iso)
    };
    // nama pilihan: jenis pembeli (senarai harga) atau tajuk varian (Maxcheck)
    t.label = p => PL ? (t.types[p.types.join("+")] || p.types.map(x => t.types[x]).join(" & ")) + (p.no ? ` · ${t.page(p.no)}` : "") : p.label;
    return t;
  };
  let T = texts();
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const all = M.groups.flatMap(g => g.models);
  const list = sec.querySelector("#mxList"), view = sec.querySelector("#mxView");
  const WAICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3Z"/></svg>';
  const DLICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.2l3.3-3.3 1.4 1.4L12 17l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM4 19h16v2H4v-2Z"/></svg>';

  let cur = null, page = 0, zoom = matchMedia("(max-width:760px)").matches;
  const frame = () => view.querySelector(".mx-frame");
  const effOf = p => (PL && p.effective) || cur.effective || "";
  function render() {
    const m = cur, p = m.pages[page];
    const choice = (x, i) => `<button type="button" data-page="${i}" class="${i === page ? "on" : ""}">${esc(T.label(x))}${!PL && (x.code || x.note) ? `<small>${esc(x.code)}${x.note ? ` · ${T.noteFor} ${esc(T.month(x.note))}` : ""}</small>` : ""}</button>`;
    view.hidden = false;
    view.innerHTML = `<div class="mx-head"><div><p class="mx-kicker">${T.kicker}${p.code ? ` · ${T.code} ${esc(p.code)}` : ""}</p><h3>Toyota ${esc(m.name)}</h3><p class="mx-eff">${effOf(p) ? esc(T.eff(T.month(effOf(p)))) : ""}</p></div>
        <button type="button" class="mx-close" aria-label="${T.close}">✕</button></div>
      ${PL && m.variants && m.variants.length ? `<p class="mx-covers">${T.covers} <b>${m.variants.map(esc).join(" · ")}</b></p>` : ""}
      ${m.pages.length > 1 ? `<p class="mx-pick">${T.variant}</p><div class="mx-variants">${m.pages.map(choice).join("")}</div>` : `<p class="mx-pick"><b>${esc(T.label(p))}</b></p>`}
      <div class="mx-share"><button type="button" class="mx-wa">${WAICO}<span>${T.share}</span></button><button type="button" class="mx-dl">${DLICO}<span>${T.download}</span></button></div>
      <p class="mx-sharemsg" role="status" hidden></p>
      <div class="mx-tools"><button type="button" class="mx-zoom">${zoom ? T.fit : T.zoom}</button><button type="button" class="mx-full">${T.full}</button></div>
      <div class="mx-frame${zoom ? " zoomed" : ""}" tabindex="0"><img src="${BASE + p.img}" width="${p.w}" height="${p.h}"${PL ? ` style="--zw:${Math.round(p.w * 0.43)}px"` : ""} alt="${esc(T.alt(m.name, T.label(p)))}"></div>
      <p class="mx-hint">${T.swipe}</p>`;
    start();
  }
  // di telefon (dibesarkan): Maxcheck mula di lajur pakej supaya jarak service terus nampak; senarai harga mula dari kiri
  const start = () => { const f = frame(); if (!f) return; const img = f.querySelector("img"); const go = () => { f.scrollLeft = zoom && !PL ? Math.max(0, img.clientWidth * 0.39) : 0; }; if (img.complete) go(); else img.addEventListener("load", go, { once: true }); };
  function open(id, scroll = true) {
    // senarai harga: satu butang setiap model, jadi pautan lama ?model=vios-hev buka "vios"
    const m = all.find(x => x.id === id) || (PL && all.find(x => x.id === id.replace(/-hev$/, ""))); if (!m) return;
    cur = m; page = 0; render();
    history.replaceState(null, "", location.pathname + "?" + (EN ? "" : "lang=bm&") + "model=" + m.id);
    list.querySelectorAll("button").forEach(b => { const on = b.dataset.id === m.id; b.classList.toggle("on", on); b.setAttribute("aria-expanded", on ? "true" : "false"); });
    if (scroll) {
      // tunggu gambar siap dahulu, supaya skrol tidak terhenti separuh jalan
      const im = view.querySelector(".mx-frame img"); let done = false;
      const go = () => { if (done) return; done = true; start(); requestAnimationFrame(() => view.scrollIntoView({ behavior: "smooth", block: "start" })); };
      if (im.complete) go(); else { im.addEventListener("load", go, { once: true }); setTimeout(go, 1500); }
    }
  }

  // ---------- kongsi & muat turun: JPEG resolusi penuh dibuat daripada gambar paparan ----------
  const files = new Map();
  const shareData = () => {
    const m = cur, p = m.pages[page], label = T.label(p), eff = effOf(p);
    const slug = s => s.replace(/&/g, "and").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
    const name = slug(`Toyota ${m.name} ${PL ? "price list" : "Maxcheck"} ${label} ${PL ? eff : ""}`) + ".jpg";
    const link = SITE + BASE + "?" + (EN ? "" : "lang=bm&") + "model=" + m.id;
    return { url: BASE + p.img, name, text: T.caption(m.name, label, eff && T.month(eff)) + "\n" + link };
  };
  async function toJpeg(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const src = URL.createObjectURL(await r.blob());
    try {
      const im = new Image(); im.src = src; await im.decode();
      const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0);
      return await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error("toBlob")), "image/jpeg", 0.92));
    } finally { URL.revokeObjectURL(src); }
  }
  const getFile = d => {
    const key = d.url + "|" + d.name;
    if (!files.has(key)) files.set(key, toJpeg(d.url).then(b => new File([b], d.name, { type: "image/jpeg" })).catch(e => { files.delete(key); throw e; }));
    return files.get(key);
  };
  const canShareFiles = () => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.jpg", { type: "image/jpeg" })] })); } catch { return false; } };
  const say = html => { const el = view.querySelector(".mx-sharemsg"); if (el) { el.innerHTML = html; el.hidden = !html; } };
  function save(file) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.className = "mx-save";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }
  // jalankan satu tindakan sambil butang tunjuk "Sediakan gambar…"
  async function busy(btn, idle, job) {
    const label = btn.querySelector("span");
    say(""); btn.disabled = true; label.textContent = T.wait;
    try { await job(); label.textContent = idle; }
    catch (e) {
      if (e && e.name === "NotAllowedError") label.textContent = T.again; // gambar dah sedia; tekan sekali lagi
      else { label.textContent = idle; if (!e || e.name !== "AbortError") say(T.failed); }
    } finally { btn.disabled = false; }
  }
  function share(btn) {
    const d = shareData();
    busy(btn, T.share, async () => {
      if (canShareFiles()) return navigator.share({ files: [await getFile(d)], text: d.text });
      save(await getFile(d)); // cth. komputer tanpa kongsi fail: muat turun, kemudian buka WhatsApp untuk lampirkan
      say(`${T.saved} <a class="mx-wa-share" href="${esc("https://wa.me/?text=" + encodeURIComponent(d.text))}" target="_blank" rel="noopener">${T.openWa} ›</a>`);
    });
  }
  function download(btn) {
    const d = shareData();
    busy(btn, T.download, async () => { save(await getFile(d)); say(T.inApp); });
  }

  list.addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (b) open(b.dataset.id); });
  // mula sediakan gambar sebaik jari menyentuh butang
  view.addEventListener("pointerdown", e => { if (e.target.closest(".mx-share button")) getFile(shareData()).catch(() => {}); });
  view.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.page !== undefined) { page = +t.dataset.page; render(); return; }
    if (t.classList.contains("mx-wa")) { share(t); return; }
    if (t.classList.contains("mx-dl")) { download(t); return; }
    if (t.classList.contains("mx-zoom")) { zoom = !zoom; frame().classList.toggle("zoomed", zoom); t.textContent = zoom ? T.fit : T.zoom; start(); return; }
    if (t.classList.contains("mx-close")) { history.replaceState(null, "", location.pathname + (EN ? "" : "?lang=bm")); view.hidden = true; view.innerHTML = ""; list.querySelectorAll("button").forEach(b => { b.classList.remove("on"); b.setAttribute("aria-expanded", "false"); }); return; }
    if (t.classList.contains("mx-full")) fullscreen();
  });
  view.addEventListener("click", e => { if (e.target.tagName === "IMG" && e.target.closest(".mx-frame")) fullscreen(); });

  // skrin penuh: mula dengan seluruh muka surat muat dalam skrin; ketik gambar / butang untuk zoom.
  // Di telefon tegak, butang "Pusing" putarkan helaian melintang supaya penuh skrin.
  function fullscreen() {
    const p = cur.pages[page];
    const o = document.createElement("div"); o.className = "mx-overlay"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    o.innerHTML = `<div class="mx-ov-bar"><button type="button" class="mx-ov-zoom">${T.zoom}</button><button type="button" class="mx-ov-rot" hidden>${T.rotate}</button><button type="button" class="mx-ov-close">✕ ${T.close}</button></div>
      <div class="mx-ov-scroll"><div class="mx-ov-page"><img src="${BASE + p.img}" alt="${esc(T.alt(cur.name, T.label(p)))}"></div></div>`;
    const box = o.querySelector(".mx-ov-scroll"), sheet = o.querySelector(".mx-ov-page"), img = sheet.querySelector("img");
    const zb = o.querySelector(".mx-ov-zoom"), rb = o.querySelector(".mx-ov-rot");
    let big = false, turned = false;
    const fitScale = t => Math.min(box.clientWidth / (t ? p.h : p.w), box.clientHeight / (t ? p.w : p.h));
    const layout = () => {
      const canTurn = fitScale(true) > fitScale(false) * 1.15; // hanya bila memusing menjadikan helaian jauh lebih besar
      if (!canTurn) turned = false;
      rb.hidden = !canTurn;
      const fit = fitScale(turned), s = big ? Math.max(fit * 2, Math.min(1, 1700 / p.w)) : fit;
      const w = Math.floor(p.w * s), h = Math.floor(p.h * s);
      sheet.style.width = (turned ? h : w) + "px"; sheet.style.height = (turned ? w : h) + "px";
      img.style.width = w + "px"; img.style.height = h + "px";
      img.style.transform = turned ? `translateX(${h}px) rotate(90deg)` : "none";
      o.classList.toggle("zoomed", big);
      zb.textContent = big ? T.fit : T.zoom; rb.setAttribute("aria-pressed", turned ? "true" : "false");
    };
    // zoom masuk berpusat pada titik yang diketik (atau tengah helaian)
    const toggle = pt => {
      const r = sheet.getBoundingClientRect();
      const fx = pt ? (pt.x - r.left) / r.width : 0.5, fy = pt ? (pt.y - r.top) / r.height : 0.5;
      big = !big; layout();
      box.scrollLeft = big ? sheet.offsetWidth * fx - box.clientWidth / 2 : 0;
      box.scrollTop = big ? sheet.offsetHeight * fy - box.clientHeight / 2 : 0;
    };
    const done = () => { o.remove(); document.documentElement.classList.remove("mx-lock"); removeEventListener("keydown", key); removeEventListener("resize", layout); };
    const key = e => { if (e.key === "Escape") done(); };
    zb.addEventListener("click", () => toggle());
    rb.addEventListener("click", () => { turned = !turned; big = false; layout(); });
    img.addEventListener("click", e => toggle({ x: e.clientX, y: e.clientY }));
    o.querySelector(".mx-ov-close").addEventListener("click", done);
    addEventListener("keydown", key);
    addEventListener("resize", layout);
    document.documentElement.classList.add("mx-lock");
    document.body.appendChild(o);
    layout();
    o.querySelector(".mx-ov-close").focus();
  }

  // butang BM | EN: tukar bahasa di halaman yang sama
  const year = new Date(M.checkedAt).getFullYear();
  const titles = PL ? { en: `Toyota Price List ${year} Peninsular Malaysia, All Models | Wan Jasni`, bm: `Senarai Harga Toyota ${year} Semenanjung, Semua Model | Wan Jasni` }
    : { en: `Toyota Maxcheck Service Schedule ${year} for Every Model | Wan Jasni`, bm: `Jadual Service Maxcheck Toyota ${year} Setiap Model | Wan Jasni` };
  const langBtns = [...document.querySelectorAll(".p-lang a[data-lang]")];
  const markLang = () => {
    langBtns.forEach(a => { if (a.dataset.lang === (EN ? "en" : "bm")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    // butang Price & Maxcheck kekalkan bahasa pilihan
    document.querySelectorAll(".p-top a.p-mx:not(.p-home)").forEach(a => a.setAttribute("href", a.getAttribute("href").split("?")[0] + (EN ? "" : "?lang=bm")));
    const home = document.querySelector(".p-top a.p-home"); if (home) home.setAttribute("href", EN ? "/en/" : "/");
  };
  const urlFor = () => { const q = new URLSearchParams(); if (!EN) q.set("lang", "bm"); if (cur && !view.hidden) q.set("model", cur.id); const s = q.toString(); return location.pathname + (s ? "?" + s : ""); };
  langBtns.forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    EN = a.dataset.lang === "en"; T = texts();
    root.classList.toggle("bm", !EN); root.lang = EN ? "en" : "ms"; document.title = EN ? titles.en : titles.bm;
    markLang();
    if (cur && !view.hidden) render();
    history.replaceState(null, "", urlFor());
  }));
  markLang();

  // pautan terus: /maxcheck/?model=vios atau /pricelist/?model=vios (boleh tambah &lang=bm)
  const q = new URLSearchParams(location.search), want = q.get("model") || q.get("maxcheck");
  if (want) {
    open(want, false);
    if (!view.hidden) {
      // skrol terus (tanpa animasi) selepas gambar & laman siap dimuat; dua kali kerana gambar boleh lewat
      const jump = () => { start(); view.scrollIntoView({ behavior: "instant", block: "start" }); };
      const im = view.querySelector(".mx-frame img");
      if (!im.complete) im.addEventListener("load", jump, { once: true });
      if (document.readyState === "complete") setTimeout(jump, 100); else addEventListener("load", () => { setTimeout(jump, 100); setTimeout(jump, 900); });
    }
  }
})();
