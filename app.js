(() => {
  const D = window.TOYOTA, M = D.models;
  const PHONE = "60163313607";
  const $ = id => document.getElementById(id);
  const rm = n => "RM" + Math.round(n).toLocaleString("en-MY");
  const num = n => Math.round(n).toLocaleString("en-MY");
  const wa = text => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const minPrice = m => Math.min(...m.grades.map(g => g.price));
  const byId = id => M.find(m => m.id === id);
  const TYPE = { Sedan: "Sedan", Hatchback: "Hatchback", SUV: "SUV", MPV: "MPV", Pickup: "Pikap", Van: "Van" };
  const CC_FALLBACK = { corolla: "1.8", "corolla-cross": "1.8", camry: "2.5", zenix: "2.0", hiace: "3.0", harrier: "2.5", veloz: "1.5", vios: "1.5", yaris: "1.5", "yaris-cross": "1.5", hilux: "2.4", fortuner: "2.4" };
  const engineOf = (m, g) => (g.name.match(/(\d\.\d)/) || [, CC_FALLBACK[m.id]])[1];

  // data-wa: mesej lalai pada pautan WhatsApp statik
  document.querySelectorAll("[data-wa]").forEach(a => a.href = wa(a.dataset.wa));
  $("updatedAt").textContent = new Date(D.updatedAt).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
  $("modelCount").textContent = M.length + " MODEL,";

  // slider fill
  const fill = r => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%");

  /* ---------- HERO STRIP ---------- */
  const HERO = ["vios", "yaris-cross", "corolla-cross", "hilux"];
  let heroI = 2, heroTimer;
  const heroSet = i => {
    heroI = i; const m = byId(HERO[i]), img = $("heroCar");
    img.style.opacity = 0;
    setTimeout(() => { img.src = m.cut; img.alt = "Toyota " + m.name; img.style.opacity = 1; }, 200);
    [...$("heroStrip").querySelectorAll("button")].forEach((b, j) => b.classList.toggle("on", j === i));
  };
  $("heroStrip").innerHTML = HERO.map(id => { const m = byId(id); return `<button type="button"><b>${m.name}</b><span>dari ${rm(minPrice(m))}</span></button>`; }).join("") + `<a href="#model">Lihat semua ${M.length} model →</a>`;
  [...$("heroStrip").querySelectorAll("button")].forEach((b, i) => b.addEventListener("click", () => { clearInterval(heroTimer); heroSet(i); showModel(HERO[i]); }));
  heroSet(heroI);
  heroTimer = setInterval(() => heroSet((heroI + 1) % HERO.length), 4500);

  /* ---------- MODEL ---------- */
  let cur = { m: M[0], g: 0, c: 0 };
  $("modelTabs").innerHTML = M.map(m => `<button type="button" role="tab" data-id="${m.id}"><b>${m.name}</b><span>dari ${rm(minPrice(m))}</span></button>`).join("");
  $("modelTabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) showModel(b.dataset.id); });
  function showModel(id, gi = 0) {
    cur = { m: byId(id), g: gi, c: 0 };
    const g0 = cur.m.grades[gi]; const free = g0.cols.findIndex(c => !c.p); cur.c = free < 0 ? 0 : free;
    [...$("modelTabs").children].forEach(b => { const on = b.dataset.id === id; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); if (on) { const t = $("modelTabs"); t.scrollTo({ left: b.offsetLeft - t.offsetLeft - 8, behavior: "smooth" }); } });
    renderModel();
  }
  function renderModel() {
    const { m } = cur, g = m.grades[cur.g], col = g.cols[cur.c];
    $("mType").textContent = TYPE[m.type] || m.type;
    $("mName").textContent = "Toyota " + m.name;
    $("mGrades").innerHTML = m.grades.map((x, i) => `<button type="button" class="${i === cur.g ? "on" : ""}" data-i="${i}">${x.name.replace(m.name === "Innova Zenix" ? "Innova Zenix " : m.name + " ", "")}</button>`).join("");
    const img = $("mImg");
    img.style.opacity = 0;
    const src = col ? col.img : m.cut;
    const pre = new Image(); pre.onload = () => { img.src = src; img.style.opacity = 1; }; pre.src = src;
    img.alt = `Toyota ${g.name}${col ? " warna " + col.n : ""}`;
    $("mColName").textContent = col ? col.n + (col.p ? ` (+${rm(col.p)})` : "") : "Warna: tanya Wan Jasni";
    $("mSwatches").innerHTML = g.cols.map((c, i) => `<button type="button" class="${i === cur.c ? "on" : ""}" data-i="${i}" style="background:${c.hex}" title="${c.n}" aria-label="${c.n}"></button>`).join("");
    const fuels = [...new Set(m.grades.map(x => x.fuel))].join(" / ");
    $("mSpecs").innerHTML = [["Enjin", engineOf(m, g) + " L"], ["Bahan api", g.fuel], ["Jenis badan", TYPE[m.type] || m.type], ["Varian", m.grades.length + " (" + fuels + ")"]]
      .map(([k, v]) => `<dl><dt>${k}</dt><dd>${v}</dd></dl>`).join("");
    $("mPrice").textContent = rm(g.price);
    $("mColNote").textContent = col && col.p ? `Warna ${col.n} tambah ${rm(col.p)}.` : "Harga OTR Semenanjung, termasuk SST, tanpa insurans.";
    $("mAsk").href = wa(`Salam Wan Jasni, saya berminat dengan Toyota ${g.name}${col ? " warna " + col.n : ""}. Boleh share harga terkini dan rebate bulan ini?`);
    $("mBrochure").href = m.url;
  }
  $("mGrades").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur.g = +b.dataset.i; const f = cur.m.grades[cur.g].cols.findIndex(c => !c.p); cur.c = f < 0 ? 0 : f; renderModel(); });
  $("mSwatches").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur.c = +b.dataset.i; renderModel(); });
  $("mCalc").addEventListener("click", () => { calcSet(cur.m.id, cur.g); $("kalkulator").scrollIntoView({ behavior: "smooth" }); });
  showModel(M[0].id);

  /* ---------- KALKULATOR ---------- */
  // Anggaran insurans komprehensif, tarif Semenanjung (sama seperti Toyota Loan Calculator Wan):
  // asas ikut cc untuk RM1,000 pertama + RM26 setiap RM1,000 seterusnya, tolak NCD, +SST 8% + duti setem RM10, +20%
  const CCN = { "1.5": 1496, "1.8": 1798, "2.0": 1987, "2.4": 2393, "2.5": 2487, "2.7": 2694, "2.8": 2755, "3.0": 2982 };
  const BASE = [[1400, 273.8], [1650, 305.5], [2200, 339.1], [3050, 372.6], [4100, 404.3], [4250, 436], [4400, 469.6], [Infinity, 501.3]];
  const insurance = (cc, price, ncd) => {
    const base = BASE.find(b => cc <= b[0])[1];
    const gross = base + 26 * Math.max(0, Math.ceil(price / 1000) - 1);
    return (gross * (1 - ncd / 100) * 1.08 + 10) * 1.2;
  };
  const NCDS = [[0, "Kereta pertama"], [25, "1 tahun"], [30, "2 tahun"], [38.33, "3 tahun"], [45, "4 tahun"], [55, "5 tahun ke atas"]];
  const C = { m: M[0], g: 0, ncd: 0 };
  const calcModels = M.filter(m => m.id !== "hiace");
  $("cModels").innerHTML = calcModels.map(m => `<button type="button" data-id="${m.id}">${m.name}</button>`).join("");
  $("cNcd").innerHTML = NCDS.map(([v, t], i) => `<button type="button" data-i="${i}">${v}%<small>${t}</small></button>`).join("");
  function calcSet(id, gi = 0) {
    C.m = byId(id); C.g = gi;
    [...$("cModels").children].forEach(b => b.classList.toggle("on", b.dataset.id === id));
    $("cGrades").innerHTML = C.m.grades.map((g, i) => `<button type="button" data-i="${i}" class="${i === gi ? "on" : ""}">${g.name.replace(/^Innova Zenix |^[A-Za-z]+ (Cross )?/, "")}</button>`).join("");
    $("cPrice").value = num(C.m.grades[gi].price);
    calc();
  }
  $("cModels").addEventListener("click", e => { const b = e.target.closest("button"); if (b) calcSet(b.dataset.id); });
  $("cGrades").addEventListener("click", e => { const b = e.target.closest("button"); if (b) calcSet(C.m.id, +b.dataset.i); });
  $("cNcd").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; C.ncd = +b.dataset.i; calc(); });
  $("cPrice").addEventListener("input", e => { const v = e.target.value.replace(/[^\d]/g, ""); e.target.value = v ? num(+v) : ""; calc(); });
  ["cDep", "cYears", "cRate"].forEach(id => $(id).addEventListener("input", calc));
  function calc() {
    const price = +$("cPrice").value.replace(/[^\d]/g, "") || 0;
    const depPct = +$("cDep").value, years = +$("cYears").value, rate = +$("cRate").value;
    const dep = price * depPct / 100, loan = price - dep, interest = loan * rate / 100 * years, total = loan + interest;
    const monthly = years ? total / (years * 12) : 0;
    const g = C.m.grades[C.g], cc = CCN[engineOf(C.m, g)] || 1496, ncdV = NCDS[C.ncd][0];
    const ins = insurance(cc, price, ncdV);
    ["cDep", "cYears", "cRate"].forEach(id => fill($(id)));
    $("cDepOut").textContent = `${depPct}% (${rm(dep)})`;
    $("cYearsOut").textContent = years + " tahun";
    $("cRateOut").textContent = rate.toFixed(2) + "%";
    $("cNcdOut").textContent = ncdV + "%";
    [...$("cNcd").children].forEach((b, i) => b.classList.toggle("on", i === C.ncd));
    $("rMonthly").textContent = num(monthly);
    $("rPrice").textContent = rm(price); $("rDep").textContent = rm(dep); $("rLoan").textContent = rm(loan);
    $("rInt").textContent = rm(interest); $("rTotal").textContent = rm(total);
    $("rIns").textContent = "±" + rm(ins); $("rUpfront").textContent = "±" + rm(dep + ins);
    $("rSend").href = wa(`Salam Wan Jasni, saya dah kira ansuran di laman Wan Jasni:\n\nModel: Toyota ${g.name}\nHarga OTR: ${rm(price)}\nDeposit: ${depPct}% (${rm(dep)})\nTempoh: ${years} tahun\nKadar: ${rate.toFixed(2)}% setahun\nNCD: ${ncdV}%\nAnggaran ansuran: ${rm(monthly)}/bulan\n\nBoleh Wan Jasni semak dengan bank dan share rebate bulan ini?`);
  }
  calcSet("vios");

  /* ---------- PEMILIH MODEL ---------- */
  const TAGS = {
    vios: { pax: [2, 5], use: ["city"] }, yaris: { pax: [2, 5], use: ["city"] },
    "yaris-cross": { pax: [2, 5], use: ["city", "far"] }, corolla: { pax: [2, 5], use: ["far", "city"] },
    "corolla-cross": { pax: [5, 2], use: ["far", "city"] }, camry: { pax: [5, 2], use: ["far"] },
    harrier: { pax: [5, 2], use: ["far"] }, veloz: { pax: [7, 5], use: ["city", "far"] },
    zenix: { pax: [7, 5], use: ["far"] }, fortuner: { pax: [7, 5], use: ["far", "work"] },
    hilux: { pax: [2, 5], use: ["work"] }
  };
  const est = p => { const loan = p * 0.9; return (loan + loan * 0.023 * 9) / 108; };
  const WHY = {
    city: "Saiz mudah untuk trafik dan parkir harian, dan jimat untuk ulang-alik kerja.",
    far: "Selesa untuk perjalanan jauh, ruang kabin dan bagasi cukup untuk balik kampung.",
    work: "Tahan lasak, four wheel drive dan cargo bed untuk kerja serta angkut barang.",
    save: "Enjin HEV paling jimat minyak, sesuai kalau awak banyak memandu setiap hari."
  };
  const A = {};
  $("quiz").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const q = b.closest(".q"); A[q.dataset.q] = b.dataset.v;
    q.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    if (A.pax && A.use && A.budget) recommend();
  });
  function recommend() {
    const pax = +A.pax, use = A.use, budget = +A.budget, list = [];
    for (const [id, t] of Object.entries(TAGS)) {
      const m = byId(id);
      m.grades.forEach((g, gi) => {
        let s = 0;
        if (t.pax[0] === pax) s += 3; else if (t.pax.includes(pax)) s += 2; else if (pax === 2 && t.pax.includes(5)) s += 1; else return;
        if (use === "save") { if (g.fuel !== "HEV") return; s += 4; }
        else if (t.use[0] === use) s += 4; else if (t.use.includes(use)) s += 2; else if (use === "work") return;
        list.push({ m, g, gi, s, mo: est(g.price) });
      });
    }
    const within = list.filter(x => x.mo <= budget);
    const pool = within.length ? within : list.slice().sort((a, b) => a.mo - b.mo).slice(0, 3);
    pool.sort((a, b) => b.s - a.s || (within.length ? b.mo - a.mo : a.mo - b.mo));
    const best = pool[0];
    if (!best) { $("pick").innerHTML = `<div class="pick-empty"><p class="kicker light">Cadangan Wan Jasni</p><h3>MARI BINCANG</h3><p>Gabungan ini perlukan perbincangan. WhatsApp Wan Jasni untuk cadangan terbaik.</p></div>`; return; }
    const seen = new Set([best.m.id]), alts = [];
    for (const x of pool.slice(1)) { if (!seen.has(x.m.id)) { seen.add(x.m.id); alts.push(x); } if (alts.length === 2) break; }
    const over = !within.length;
    $("pick").innerHTML = `<div class="pick-res rv in">
      <div>
        <p class="kicker light">Cadangan Wan Jasni</p>
        <h3>Toyota ${best.g.name}</h3>
        <p class="why">${WHY[use]}${over ? " Model ini sedikit melebihi bajet awak; Wan Jasni boleh bantu cari susunan deposit yang selesa." : ""}</p>
        <div class="mini"><div><b>${rm(best.g.price)}</b><span>Harga OTR tanpa rebate*</span></div><div><b>±${rm(best.mo)}</b><span>Sebulan (deposit 10%, 9 tahun, 2.3%)</span></div></div>
        <div class="hero-cta" style="margin-top:0">
          <button class="btn btn-red" type="button" data-go="${best.m.id}" data-gi="${best.gi}">Lihat model</button>
          <a class="btn btn-ghost" target="_blank" rel="noopener" href="${wa(`Salam Wan Jasni, pemilih model di laman Wan Jasni cadangkan Toyota ${best.g.name} untuk saya. Boleh terangkan lebih lanjut?`)}">Tanya Wan Jasni</a>
        </div>
        ${alts.length ? `<p class="alt">Pilihan lain: ${alts.map(x => `<button type="button" data-go="${x.m.id}" data-gi="${x.gi}">${x.g.name}</button> (±${rm(x.mo)}/bulan)`).join(", ")}</p>` : ""}
      </div>
      <img src="${best.m.cut}" alt="Toyota ${best.m.name}" width="450" height="190">
    </div>`;
  }
  $("pick").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (!b) return; showModel(b.dataset.go, +b.dataset.gi); $("model").scrollIntoView({ behavior: "smooth" }); });

  /* ---------- SENARAI SEMAK ---------- */
  const chk = [...$("checklist").querySelectorAll("button")];
  const chkUpd = () => {
    const n = chk.filter(b => b.getAttribute("aria-pressed") === "true").length;
    $("chkCount").textContent = `${n} daripada ${chk.length}`;
    $("chkBar").style.width = (n / chk.length * 100) + "%";
    $("chkLabel").textContent = n === chk.length ? "Sedia dipandu pulang" : n ? "Sedang disemak" : "Tekan setiap perkara";
  };
  chk.forEach(b => b.addEventListener("click", () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); chkUpd(); }));

  /* ---------- PROSES ---------- */
  const STEPS = [
    ["Pandu uji & pilih varian", "Rasa sendiri bagaimana kereta itu dipandu sebelum buat keputusan. Wan Jasni sediakan kereta pandu uji dan bantu bandingkan varian, termasuk petrol dan HEV.", ["Bandingkan saiz, ruang dan ciri keselamatan", "Tanya soalan terus kepada Wan Jasni di showroom", "Ambil gambar dan brochure untuk dibincang di rumah"], "Lazimnya 30 hingga 60 minit"],
    ["Sebut harga & rebate", "Wan Jasni sediakan pecahan harga penuh supaya tiada kejutan kemudian.", ["Harga OTR varian dan warna pilihan", "Rebate dan promosi bulan semasa, tertakluk pada terma dan syarat", "Anggaran insurans dan aksesori jika mahu"], "Boleh dibuat melalui WhatsApp"],
    ["Semakan & permohonan loan", "Wan Jasni bantu hantar permohonan loan kepada bank supaya awak dapat tawaran yang selesa.", ["Dokumen lazim: IC, slip gaji dan penyata bank terkini", "Pekerja sendiri: dokumen perniagaan dan penyata akaun", "Wan Jasni maklumkan status kelulusan kepada awak"], "Bergantung pada bank"],
    ["Tempahan & pengesahan", "Selepas setuju harga dan loan, tempahan dibuat dan varian serta warna disahkan.", ["Bayar yuran tempahan", "Sahkan varian, warna dan aksesori", "Wan Jasni semak stok dan anggaran tarikh kereta sampai"], "Tempoh tunggu ikut model dan warna"],
    ["Pendaftaran & insurans", "Kereta didaftarkan atas nama awak dan insurans serta road tax disediakan.", ["Pendaftaran JPJ dan nombor plat", "Polisi insurans dan road tax", "Wan Jasni kemas kini setiap peringkat melalui WhatsApp"], "Diuruskan oleh pengedar"],
    ["Penyerahan & service pertama", "Hari ambil kunci. Kereta disemak bersama awak dan setiap ciri diterangkan.", ["Pemeriksaan kereta dan dokumen bersama awak", "Penerangan ciri dan sambungan telefon", "Pemeriksaan percuma pertama pada 1,000 km; Wan Jasni ingatkan jadual service"], "Wan Jasni kekal sebagai satu nombor untuk dihubungi"]
  ];
  $("stepList").innerHTML = STEPS.map((s, i) => `<li><button type="button" data-i="${i}"><b>${String(i + 1).padStart(2, "0")}</b><span>${s[0]}</span></button></li>`).join("");
  const step = i => {
    const s = STEPS[i];
    [...$("stepList").querySelectorAll("button")].forEach((b, j) => b.classList.toggle("on", j === i));
    $("stepDetail").innerHTML = `<div class="num">${String(i + 1).padStart(2, "0")}</div><h3>${s[0]}</h3><p>${s[1]}</p><ul>${s[2].map(x => `<li>${x}</li>`).join("")}</ul><p class="meta">${s[3]}</p>`;
  };
  $("stepList").addEventListener("click", e => { const b = e.target.closest("button"); if (b) step(+b.dataset.i); });
  step(0);

  /* ---------- PANDU UJI ---------- */
  const TIMES = ["10:00 pagi", "11:30 pagi", "2:00 petang", "3:30 petang", "5:00 petang"];
  const PURP = ["Pandu uji", "Sebut harga dan loan", "Lihat kereta di showroom"];
  const DOW = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  const MON = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
  const B = { t: 1, p: 0 };
  $("bModel").innerHTML = M.map(m => `<option value="${m.id}">Toyota ${m.name}</option>`).join("");
  $("bModel").value = "corolla-cross";
  $("bTime").innerHTML = TIMES.map((t, i) => `<button type="button" data-i="${i}">${t}</button>`).join("");
  $("bPurpose").innerHTML = PURP.map((t, i) => `<button type="button" data-i="${i}">${t}</button>`).join("");
  const today = new Date(); const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const tmr = new Date(today); tmr.setDate(today.getDate() + 1);
  $("bDate").min = iso(today); $("bDate").value = iso(tmr);
  $("bTime").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { B.t = +b.dataset.i; book(); } });
  $("bPurpose").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { B.p = +b.dataset.i; book(); } });
  ["bName", "bDate", "bModel"].forEach(id => $(id).addEventListener("input", book));
  function book() {
    [...$("bTime").children].forEach((b, i) => b.classList.toggle("on", i === B.t));
    [...$("bPurpose").children].forEach((b, i) => b.classList.toggle("on", i === B.p));
    const name = $("bName").value.trim(), dv = $("bDate").value, model = "Toyota " + byId($("bModel").value).name;
    let dateTxt = "";
    if (dv) {
      const [y, mo, d] = dv.split("-").map(Number), dt = new Date(y, mo - 1, d);
      $("pDay").textContent = d; $("pMon").textContent = MON[mo - 1]; $("pDow").textContent = DOW[dt.getDay()];
      dateTxt = `${DOW[dt.getDay()]}, ${d} ${MON[mo - 1]} ${y}`;
      $("pTime").textContent = `${TIMES[B.t]}, ${y}`;
    }
    $("pName").textContent = name || "Nama awak"; $("pModel").textContent = model; $("pPurpose").textContent = PURP[B.p];
    $("bSend").href = wa(`Salam Wan Jasni, saya nak tempah slot:\n\nNama: ${name || "-"}\nTarikh: ${dateTxt || "-"}\nMasa: ${TIMES[B.t]}\nModel: ${model}\nTujuan: ${PURP[B.p]}\n\nBoleh Wan Jasni sahkan?`);
  }
  book();

})();
