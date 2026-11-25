(() => {
  const D = window.TOYOTA, M = D.models;
  const PHONE = "60163313607";
  const EN = document.documentElement.lang === "en";
  const BASE = window.SITE_BASE || ""; // "../" pada /en/
  const $ = id => document.getElementById(id);
  const rm = n => "RM" + Math.round(n).toLocaleString("en-MY");
  const num = n => Math.round(n).toLocaleString("en-MY");
  const wa = text => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const minPrice = m => Math.min(...m.grades.map(g => g.price));
  const byId = id => M.find(m => m.id === id);
  const CC_FALLBACK = { gr86: "2.4", "gr-yaris": "1.6", "gr-corolla": "1.6", alphard: "2.4", vellfire: "2.5", "hiace-slwb": "2.8", corolla: "1.8", "corolla-cross": "1.8", camry: "2.5", zenix: "2.0", hiace: "3.0", harrier: "2.5", veloz: "1.5", vios: "1.5", yaris: "1.5", "yaris-cross": "1.5", hilux: "2.4", fortuner: "2.4" };
  const engineOf = (m, g) => g.fuel === "EV" ? null : (g.name.match(/(\d\.\d)/) || [, CC_FALLBACK[m.id]])[1];

  /* ---------- TEKS BM / EN ---------- */
  const L = EN ? {
    locale: "en-MY", from: "from",
    month: s => s, rebNote: (mo, r) => `${mo} rebate: −${r}*`, rebToggle: (mo, r) => r ? `Deduct ${mo} rebate (${r})` : "No rebate this month for this variant",
    wsLbl: c => `Windscreen (cover ${c})`,
    upDep: "Upfront (deposit only)", upBoth: "Upfront (deposit + insurance)", insLoanX: i => `
Insurance: included in the loan (±${i})`,
    colLbl: c => `Colour: ${c}`, free: "no extra charge", noRebate: "no rebate",
    sendX: (c, cp, rb) => `\nColour: ${c}${cp ? " (+" + cp + ")" : ""}\nRebate: ${rb}`, seeAll: n => `Full list of ${n} models →`, models: n => `EVERY TOYOTA MODEL,`,
    type: { Sedan: "Sedan", Hatchback: "Hatchback", SUV: "SUV", MPV: "MPV", Pickup: "Pickup", Van: "Van", Coupe: "Coupe" }, electric: "Electric",
    fuel: { Petrol: "Petrol", HEV: "HEV", Diesel: "Diesel", EV: "Electric (EV)" },
    colourWord: " in ", askColour: "Colour: ask Wan Jasni", illus: "colour illustration",
    specs: ["Engine", "Fuel", "Body type", "Variants"],
    colNote: (c, p) => `${c} colour adds ${p}.`, otrNote: "Peninsular OTR price, including SST, without insurance.",
    ask: (g, c) => `Hi Wan Jasni, I'm interested in the Toyota ${g}${c ? " in " + c : ""}. Could you check if this colour is in stock?`,
    ncd: [[0, "First car"], [25, "1 year"], [30, "2 years"], [38.33, "3 years"], [45, "4 years"], [55, "5 years +"]],
    years: y => y + (y === 1 ? " year" : " years"),
    send: (g, p, d, dp, y, r, n, mo) => `Hi Wan Jasni, I calculated an instalment on your website:\n\nModel: Toyota ${g}\nOTR price: ${p}\nDeposit: ${d}% (${dp})\nTenure: ${y} years\nRate: ${r}% per year\nNCD: ${n}%\nEstimated instalment: ${mo}/month\n\nCould you check it with the bank?`,
    why: {
      city: "Easy to drive and park in daily traffic, and economical for the commute.",
      far: "Comfortable on long trips, with enough cabin and boot space for the balik kampung run.",
      work: "Tough, with four wheel drive and a cargo bed for work and hauling.",
      save: "A HEV engine is the most fuel efficient choice if you drive a lot every day."
    },
    over: " This is slightly above your budget; Wan Jasni can help find a comfortable deposit arrangement.",
    pickK: "Wan Jasni's pick", talkH: "LET'S TALK", talkP: "This combination needs a chat. WhatsApp Wan Jasni for the best suggestion.",
    otrNoRebate: "OTR price without rebate*", perMonth: "Per month after rebate (10% deposit, 9 years, 2.3%)",
    view: "View model", askWan: "Ask Wan Jasni", others: "Other options", mo: "/month",
    jdBack: "Back", jdStep: n => `Question ${n} of 3`, jdFinding: "Finding your match…", jdMatch: "IT'S A MATCH!", jdRetry: "Try again",
    pickMsg: g => `Hi Wan Jasni, the model finder on your website suggested the Toyota ${g} for me. Could you tell me more?`,
    chk: (n, t) => `${n}/${t}`, chkDone: "Ready to drive home", chkSome: "Almost there", chkNone: "Tap each item",
    steps: [
      ["See the car & choose a variant", "See the car for yourself at the showroom and compare variants before you decide. Wan Jasni explains the difference between each variant, including petrol and HEV.", ["Compare size, space and safety features", "Ask Wan Jasni your questions in person", "Take photos and a brochure home to discuss"], "Usually 30 to 60 minutes"],
      ["Quotation & rebate", "Wan Jasni prepares a full price breakdown so there are no surprises later.", ["OTR price for your variant and colour", "This month's rebate and promotions, subject to terms and conditions", "Insurance and accessories estimate if you want them"], "Can be done over WhatsApp"],
      ["Loan check & application", "Wan Jasni helps submit your loan application to the banks so you get a comfortable offer.", ["Usual documents: IC, recent payslips and bank statements", "Self-employed: business documents and account statements", "Wan Jasni keeps you updated on the approval status"], "Depends on the bank"],
      ["Booking & confirmation", "Once the price and loan are agreed, the booking is made and your variant and colour are confirmed.", ["Pay the booking fee", "Confirm variant, colour and accessories", "Wan Jasni checks stock and the estimated arrival date"], "Waiting time depends on model and colour"],
      ["Registration & insurance", "The car is registered in your name, and insurance and road tax are arranged.", ["JPJ registration and number plate", "Insurance policy and road tax", "Wan Jasni updates you at every stage over WhatsApp"], "Handled by the dealer"],
      ["Handover & first service", "Delivery day. The car is checked with you and every feature is explained.", ["Car and document check with you", "Feature walkthrough and phone pairing", "First free inspection at 1,000 km; Wan Jasni reminds you of the service schedule"], "Wan Jasni stays your one number to call"]
    ]
  } : {
    locale: "ms-MY", from: "dari",
    month: s => s.replace("January", "Januari").replace("February", "Februari").replace("March", "Mac").replace("May", "Mei").replace("June", "Jun").replace("July", "Julai").replace("August", "Ogos").replace("October", "Oktober").replace("December", "Disember"),
    rebNote: (mo, r) => `Rebate ${mo}: −${r}*`, rebToggle: (mo, r) => r ? `Tolak rebate ${mo} (${r})` : "Varian ni takde rebate bulan ni",
    wsLbl: c => `Windscreen (cover ${c})`,
    upDep: "Duit perlu ada masa beli (deposit sahaja)", upBoth: "Duit perlu ada masa beli (deposit + insurans)", insLoanX: i => `
Insurans: masuk dalam loan (±${i})`,
    colLbl: c => `Warna: ${c}`, free: "tiada caj tambahan", noRebate: "tiada rebate",
    sendX: (c, cp, rb) => `\nWarna: ${c}${cp ? " (+" + cp + ")" : ""}\nRebate: ${rb}`, seeAll: n => `Senarai penuh ${n} model →`, models: n => `SEMUA MODEL TOYOTA,`,
    type: { Sedan: "Sedan", Hatchback: "Hatchback", SUV: "SUV", MPV: "MPV", Pickup: "Pikap", Van: "Van", Coupe: "Coupe" }, electric: "Elektrik",
    fuel: { Petrol: "Petrol", HEV: "HEV", Diesel: "Diesel", EV: "Elektrik (EV)" },
    colourWord: " warna ", askColour: "Warna: tanya Wan Jasni", illus: "gambar ilustrasi warna",
    specs: ["Enjin", "Bahan api", "Jenis badan", "Varian"],
    colNote: (c, p) => `Warna ${c} tambah ${p}.`, otrNote: "Harga on-the-road Semenanjung, dah masuk SST, belum masuk insurans.",
    ask: (g, c) => `Salam Wan Jasni, saya berminat dengan Toyota ${g}${c ? " warna " + c : ""}. Boleh semak stok warna ini?`,
    ncd: [[0, "Kereta pertama"], [25, "1 tahun"], [30, "2 tahun"], [38.33, "3 tahun"], [45, "4 tahun"], [55, "5 tahun ke atas"]],
    years: y => y + " tahun",
    send: (g, p, d, dp, y, r, n, mo) => `Salam Wan Jasni, saya dah kira ansuran di laman Wan Jasni:\n\nModel: Toyota ${g}\nHarga OTR: ${p}\nDeposit: ${d}% (${dp})\nTempoh: ${y} tahun\nKadar: ${r}% setahun\nNCD: ${n}%\nAnggaran ansuran: ${mo}/bulan\n\nBoleh Wan Jasni semak dengan bank?`,
    why: {
      city: "Senang bawa dalam jem, senang parking, dan jimat untuk pergi balik kerja.",
      far: "Selesa untuk jalan jauh, ruang dalam dan bonet cukup untuk balik kampung.",
      work: "Tahan lasak, ada four wheel drive dan cargo bed untuk kerja dan angkut barang.",
      save: "Enjin HEV paling jimat minyak, sesuai kalau awak drive banyak setiap hari."
    },
    over: " Model ni lebih sikit dari bajet awak, tapi Wan Jasni boleh tolong susun deposit supaya bayaran sebulan selesa.",
    pickK: "Pilihan Wan Jasni", talkH: "JOM BINCANG", talkP: "Yang ni kena bincang sikit. WhatsApp Wan Jasni, nanti Wan Jasni bagi cadangan terbaik.",
    otrNoRebate: "Harga OTR tanpa rebate*", perMonth: "Sebulan selepas rebate (deposit 10%, 9 tahun, 2.3%)",
    view: "Lihat model", askWan: "Tanya Wan Jasni", others: "Pilihan lain", mo: "/bulan",
    jdBack: "Balik", jdStep: n => `Soalan ${n} daripada 3`, jdFinding: "Tengah cari jodoh awak…", jdMatch: "JODOH DAH JUMPA!", jdRetry: "Cuba lagi",
    pickMsg: g => `Salam Wan Jasni, pemilihan model di laman Wan Jasni cadangkan Toyota ${g} untuk saya. Boleh terangkan lebih lanjut?`,
    chk: (n, t) => `${n}/${t}`, chkDone: "Siap, jom bawa balik!", chkSome: "Hampir siap", chkNone: "Tekan setiap satu",
    steps: [
      ["Tengok kereta & pilih varian", "Datang showroom, tengok sendiri kereta dan banding varian. Wan Jasni terangkan beza setiap satu, termasuk petrol dengan HEV.",["Banding saiz, ruang dan ciri keselamatan", "Tanya apa-apa terus kat Wan Jasni", "Ambil gambar dan brochure, bincang dengan family kat rumah"], "Biasanya 30 hingga 60 minit"],
      ["Harga penuh & rebate", "Wan Jasni bagi pecahan harga penuh, supaya takde kejutan lepas ni.",["Harga on-the-road untuk varian dan warna pilihan awak", "Rebate dan promosi bulan ni, tertakluk pada terma dan syarat", "Anggaran insurans dan aksesori kalau nak"], "Boleh buat terus dalam WhatsApp"],
      ["Mohon loan", "Wan Jasni tolong hantar permohonan loan ke bank, cari bayaran sebulan yang selesa untuk awak.",["Dokumen biasa: IC, slip gaji dan penyata bank terkini", "Kerja sendiri: dokumen bisnes dan penyata akaun", "Wan Jasni update bila bank dah lulus"], "Ikut bank"],
      ["Buat booking", "Bila harga dan loan dah okay, kita buat booking dan confirm varian dan warna.",["Bayar booking fee", "Confirm varian, warna dan aksesori", "Wan Jasni check stok dan bila kereta sampai"], "Masa tunggu ikut model dan warna"],
      ["Daftar kereta & insurans", "Kereta didaftarkan atas nama awak, insurans dan road tax pun disiapkan.",["Daftar JPJ dan dapat nombor plat", "Polisi insurans dan road tax", "Wan Jasni update setiap langkah dalam WhatsApp"], "Showroom yang uruskan"],
      ["Ambil kunci & service pertama", "Hari yang ditunggu! Kita check kereta sama-sama dan Wan Jasni tunjuk semua fungsi.",["Check kereta dan dokumen sama-sama", "Belajar guna kereta dan sambung telefon", "Pemeriksaan percuma pertama pada 1,000 km; Wan Jasni ingatkan jadual service"], "Lepas tu pun, Wan Jasni masih boleh dihubungi"]
    ]
  };
  const TYPE = L.type;
  const MONTH = L.month(D.rebateMonth || "");

  // data-wa: mesej lalai pada pautan WhatsApp statik
  document.querySelectorAll("[data-wa]").forEach(a => a.href = wa(a.dataset.wa));
  $("updatedAt").textContent = new Date(D.checkedAt || D.updatedAt).toLocaleDateString(L.locale, { day: "numeric", month: "long", year: "numeric" });
  $("modelCount").textContent = L.models(M.length);

  // slider fill
  const fill = r => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%");

  /* ---------- HERO STRIP ---------- */
  // Model pilihan untuk jalur hero; jika Toyota buang model, isi dengan model lain secara automatik
  const HERO = ["vios", "yaris-cross", "corolla-cross", "hilux"].filter(byId);
  for (const m of M) { if (HERO.length >= 4) break; if (!HERO.includes(m.id)) HERO.push(m.id); }
  let heroI = Math.min(2, HERO.length - 1), heroTimer;
  // Tema Apple: guna gambar warna rasmi Toyota (sudut depan 3/4, 900 px, lebih tajam) bukan potongan sisi 450 px
  const heroSrc = m => {
    if (document.documentElement.classList.contains("theme-apple"))
      for (const g of m.grades || []) for (const c of g.cols || []) if (c.img && !c.illus && !c.src) return BASE + c.img;
    return BASE + m.cut;
  };
  const heroSet = i => {
    heroI = i; const m = byId(HERO[i]), img = $("heroCar");
    img.style.opacity = 0;
    setTimeout(() => { img.src = heroSrc(m); img.alt = "Toyota " + m.name; img.style.opacity = 1; }, 200);
    [...$("heroStrip").querySelectorAll("button")].forEach((b, j) => b.classList.toggle("on", j === i));
  };
  $("heroStrip").innerHTML = HERO.map(id => { const m = byId(id); return `<button type="button"><b>${m.name}</b><span>${L.from} ${rm(minPrice(m))}</span></button>`; }).join("") + `<a href="#model">${L.seeAll(M.length)}</a>`;
  [...$("heroStrip").querySelectorAll("button")].forEach((b, i) => b.addEventListener("click", () => { clearInterval(heroTimer); heroSet(i); showModel(HERO[i]); }));
  heroSet(heroI);
  heroTimer = setInterval(() => heroSet((heroI + 1) % HERO.length), 4500);

  /* ---------- Warnakan gambar (untuk warna yang Toyota tiada gambar) ---------- */
  const lum = h => { const n = parseInt(String(h || "#888").slice(1), 16); return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114; };
  const lightestImg = g => g.cols.filter(c => c.img).sort((a, b) => lum(b.hex) - lum(a.hex))[0] || null;
  const tintCache = new Map();
  const tint = (src, hex, baseHex) => {
    const key = src + "|" + hex;
    // Warna sasaran lebih cerah daripada gambar asal (cth. putih dari kelabu): cerahkan dahulu sebelum diwarnakan
    const lift = Math.min(2.4, Math.max(1, lum(hex) / Math.max(40, lum(baseHex))));
    if (!tintCache.has(key)) tintCache.set(key, new Promise((ok, fail) => {
      const im = new Image(); im.crossOrigin = "anonymous";
      im.onload = () => {
        try {
          const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
          const x = c.getContext("2d");
          x.filter = `grayscale(1) brightness(${(1.08 * lift).toFixed(2)})`; x.drawImage(im, 0, 0); x.filter = "none";
          x.globalCompositeOperation = "multiply"; x.fillStyle = hex; x.fillRect(0, 0, c.width, c.height);
          x.globalCompositeOperation = "destination-in"; x.drawImage(im, 0, 0); // kekalkan latar lutsinar
          ok(c.toDataURL("image/webp", 0.85));
        } catch (e) { fail(e); }
      };
      im.onerror = fail; im.src = src;
    }));
    return tintCache.get(key);
  };

  /* ---------- MODEL ---------- */
  let cur = { m: M[0], g: 0, c: 0 };
  $("modelTabs").innerHTML = M.map(m => `<button type="button" role="tab" data-id="${m.id}"><b>${m.name}</b><span>${L.from} ${rm(minPrice(m))}</span></button>`).join("");
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
    const img = $("mImg"), token = (renderModel.t = (renderModel.t || 0) + 1);
    img.style.opacity = 0;
    const show = src => { const pre = new Image(); pre.onload = () => { if (token !== renderModel.t) return; img.src = src; img.style.opacity = 1; }; pre.src = src; };
    // Warna tanpa gambar rasmi: warnakan gambar paling cerah kereta yang sama dengan warna swatch rasmi (ilustrasi)
    const base = col && !col.img ? lightestImg(g) : null;
    if (col && col.img) show(BASE + col.img);
    else if (base) tint(BASE + base.img, col.hex, base.hex).then(show, () => show(BASE + m.cut));
    else show(BASE + m.cut);
    const illus = base || (col && col.illus);
    img.alt = `Toyota ${g.name}${col ? L.colourWord + col.n : ""}${illus ? " (" + L.illus + ")" : ""}`;
    $("mColName").textContent = col ? col.n + (col.p ? ` (+${rm(col.p)})` : "") + (illus ? ` · ${L.illus}` : "") : L.askColour;
    $("mSwatches").innerHTML = g.cols.map((c, i) => `<button type="button" class="${i === cur.c ? "on" : ""}" data-i="${i}" style="background:${c.hex}" title="${c.n}" aria-label="${c.n}"></button>`).join("");
    const fuels = [...new Set(m.grades.map(x => L.fuel[x.fuel] || x.fuel))].join(" / ");
    $("mSpecs").innerHTML = [[L.specs[0], engineOf(m, g) ? engineOf(m, g) + " L" : L.electric], [L.specs[1], L.fuel[g.fuel] || g.fuel], [L.specs[2], TYPE[m.type] || m.type], [L.specs[3], m.grades.length + " (" + fuels + ")"]]
      .map(([k, v]) => `<dl><dt>${k}</dt><dd>${v}</dd></dl>`).join("");
    $("mPrice").textContent = rm(g.price);
    $("mReb").textContent = g.rebate ? L.rebNote(MONTH, rm(g.rebate)) : "";
    $("mColNote").textContent = col && col.p ? L.colNote(col.n, rm(col.p)) : L.otrNote;
    $("mAsk").href = wa(L.ask(g.name, col && col.n));
    $("mBrochure").href = m.url;
  }
  $("mGrades").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur.g = +b.dataset.i; const f = cur.m.grades[cur.g].cols.findIndex(c => !c.p); cur.c = f < 0 ? 0 : f; renderModel(); });
  $("mSwatches").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur.c = +b.dataset.i; renderModel(); });
  $("mCalc").addEventListener("click", () => { calcSet(cur.m.id, cur.g, cur.c); $("kalkulator").scrollIntoView({ behavior: "smooth" }); });
  showModel(M[0].id);

  /* ---------- JALUR MODEL BERGERAK (ala logo pelanggan stripe.com); senarai ikut data auto-kemas kini ---------- */
  const mq = $("marquee");
  if (mq) {
    const item = (m, dup) => `<button type="button" class="mq-item" data-id="${m.id}"${dup ? ' aria-hidden="true" tabindex="-1"' : ""}><img src="${BASE + m.cut}" alt="${dup ? "" : "Toyota " + m.name}" loading="lazy"><span>${m.name}</span></button>`;
    mq.innerHTML = M.map(m => item(m, false)).join("") + M.map(m => item(m, true)).join("");
    mq.style.setProperty("--mq-dur", Math.max(40, M.length * 3.2) + "s");
    mq.addEventListener("click", e => { const b = e.target.closest(".mq-item"); if (!b) return; showModel(b.dataset.id); $("model").scrollIntoView({ behavior: "smooth" }); });
  }

  /* ---------- KALKULATOR ---------- */
  // Anggaran insurans komprehensif, tarif Semenanjung (sama seperti Toyota Loan Calculator Wan):
  // asas ikut cc untuk RM1,000 pertama + RM26 setiap RM1,000 seterusnya, tolak NCD, +SST 8% + duti setem RM10, +20%
  const CCN = { "1.5": 1496, "1.8": 1798, "2.0": 1987, "2.4": 2393, "2.5": 2487, "2.7": 2694, "2.8": 2755, "3.0": 2982 };
  const BASEPREM = [[1400, 273.8], [1650, 305.5], [2200, 339.1], [3050, 372.6], [4100, 404.3], [4250, 436], [4400, 469.6], [Infinity, 501.3]];
  const insurance = (cc, price, ncd) => {
    const base = BASEPREM.find(b => cc <= b[0])[1];
    const gross = base + 26 * Math.max(0, Math.ceil(price / 1000) - 1);
    return (gross * (1 - ncd / 100) * 1.08 + 10) * 1.2;
  };
  // Windscreen: nilai cover cadangan ikut model (windscreen2u.com "Windscreen Price List Malaysia 2026", dikemas kini 30 Sep 2026);
  // premium = 15% nilai cover. Model yang tiada dalam jadual guna anggaran ikut harga (ditanda *).
  const WS_COVER = { vios: 2000, yaris: 1500, "corolla-cross": 3000, camry: 3000, veloz: 2000, fortuner: 2000, hilux: 2000, harrier: 4000, alphard: 3500, vellfire: 3500 };
  const wsCover = (id, price) => WS_COVER[id] || (price < 120000 ? 2000 : price < 250000 ? 3000 : 3500);
  // Special perils (banjir, ribut, tanah runtuh): anggaran 0.5% nilai kereta (pasaran 0.3%-0.5%). Kedua-dua tambah SST 8%.
  const addons = (id, price) => { const cover = wsCover(id, price); return { cover, ws: cover * 0.15 * 1.08, sp: price * 0.005 * 1.08 }; };
  const NCDS = L.ncd;
  const C = { m: M[0], g: 0, c: 0, ncd: 0 };
  const calcModels = M.filter(m => m.type !== "Van");
  const gradeLabel = (m, g) => g.name.replace(m.name === "Innova Zenix" ? "Innova Zenix " : m.name + " ", "");
  const freeCol = g => g.cols.reduce((b, c, i, a) => (c.p || 0) < (a[b].p || 0) ? i : b, 0);
  $("cModels").innerHTML = calcModels.map(m => `<button type="button" data-id="${m.id}">${m.name}</button>`).join("");
  $("cNcd").innerHTML = NCDS.map(([v, t], i) => `<button type="button" data-i="${i}">${v}%<small>${t}</small></button>`).join("");
  function calcSet(id, gi = 0, ci) {
    C.m = byId(id); C.g = gi; const g = C.m.grades[gi]; C.c = ci != null && g.cols[ci] ? ci : freeCol(g);
    [...$("cModels").children].forEach(b => b.classList.toggle("on", b.dataset.id === id));
    $("cGrades").innerHTML = C.m.grades.map((x, i) => `<button type="button" data-i="${i}" class="${i === gi ? "on" : ""}">${gradeLabel(C.m, x)}</button>`).join("");
    $("cPrice").value = num(g.price);
    calc();
  }
  const colourChips = () => {
    const g = C.m.grades[C.g];
    $("cColours").innerHTML = g.cols.length ? g.cols.map((c, i) => `<button type="button" data-i="${i}" class="${i === C.c ? "on" : ""}"><i style="background:${c.hex}"></i>${c.n}${c.p ? ` <em>+${rm(c.p)}</em>` : ""}</button>`).join("") : `<span class="hint">${L.askColour}</span>`;
  };
  $("cModels").addEventListener("click", e => { const b = e.target.closest("button"); if (b) calcSet(b.dataset.id); });
  $("cGrades").addEventListener("click", e => { const b = e.target.closest("button"); if (b) calcSet(C.m.id, +b.dataset.i); });
  $("cColours").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; C.c = +b.dataset.i; calc(); });
  $("cReb").addEventListener("change", calc);
  $("cInsLoan").addEventListener("change", calc);
  // Butang − / + kadar faedah: satu tekan = 0.01%; tekan lama = berulang laju
  document.querySelectorAll(".step-btn").forEach(b => {
    const r = $("cRate"); let t1, t2;
    const go = () => { b.dataset.step > 0 ? r.stepUp() : r.stepDown(); r.dispatchEvent(new Event("input")); };
    const stop = () => { clearTimeout(t1); clearInterval(t2); };
    b.addEventListener("pointerdown", e => { e.preventDefault(); go(); t1 = setTimeout(() => { t2 = setInterval(go, 70); }, 420); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, stop));
    b.addEventListener("click", e => { if (e.detail === 0) go(); }); // papan kekunci (Enter/Space)
  });
  $("cNcd").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; C.ncd = +b.dataset.i; calc(); });
  $("cPrice").addEventListener("input", e => { const v = e.target.value.replace(/[^\d]/g, ""); e.target.value = v ? num(+v) : ""; calc(); });
  ["cDep", "cYears", "cRate"].forEach(id => $(id).addEventListener("input", calc));
  function calc() {
    const g = C.m.grades[C.g], col = g.cols[C.c];
    colourChips();
    const price = +$("cPrice").value.replace(/[^\d]/g, "") || 0;
    const colP = col ? col.p || 0 : 0, reb = g.rebate || 0;
    $("cReb").disabled = !reb; $("cRebLbl").textContent = L.rebToggle(MONTH, rm(reb));
    const rebUsed = reb && $("cReb").checked ? reb : 0;
    const net = Math.max(0, price + colP - rebUsed);
    const depPct = +$("cDep").value, years = +$("cYears").value, rate = +$("cRate").value;
    const cc = CCN[engineOf(C.m, g)] || 1496, ncdV = NCDS[C.ncd][0];
    // Laras Wan Jasni (25 Nov 2026): anggaran insurans dikurangkan 15%, setiap bahagian dibundarkan ke RM100 terdekat
    const r100 = v => Math.round(v * 0.85 / 100) * 100;
    const ad0 = addons(C.m.id, price + colP), base = r100(insurance(cc, price + colP, ncdV));
    const ad = { cover: ad0.cover, ws: r100(ad0.ws), sp: r100(ad0.sp) }, ins = base + ad.ws + ad.sp;
    // Pilihan: insurans tahun pertama dimasukkan dalam loan (deposit tetap dikira dari harga kereta)
    const insLoan = $("cInsLoan").checked ? ins : 0;
    const dep = net * depPct / 100, loan = net - dep + insLoan, interest = loan * rate / 100 * years, total = loan + interest;
    const monthly = years ? total / (years * 12) : 0;
    $("rColRow").hidden = !colP; $("rColLbl").textContent = L.colLbl(col ? col.n : ""); $("rCol").textContent = "+" + rm(colP);
    $("rRebRow").hidden = !rebUsed; $("rRebLbl").textContent = "Rebate " + MONTH; $("rReb").textContent = "−" + rm(rebUsed);
    $("rNet").textContent = rm(net);
    ["cDep", "cYears", "cRate"].forEach(id => fill($(id)));
    $("cDepOut").textContent = `${depPct}% (${rm(dep)})`;
    $("cYearsOut").textContent = L.years(years);
    $("cRateOut").textContent = rate.toFixed(2) + "%";
    $("cNcdOut").textContent = ncdV + "%";
    [...$("cNcd").children].forEach((b, i) => b.classList.toggle("on", i === C.ncd));
    $("rMonthly").textContent = num(monthly);
    $("rPrice").textContent = rm(price); $("rDep").textContent = rm(dep); $("rLoan").textContent = rm(loan);
    $("rInt").textContent = rm(interest); $("rTotal").textContent = rm(total);
    $("rIns").textContent = "±" + rm(ins); $("rInsBase").textContent = "±" + rm(base);
    $("rWsLbl").textContent = L.wsLbl(rm(ad.cover)); $("rWs").textContent = "±" + rm(ad.ws); $("rSp").textContent = "±" + rm(ad.sp); $("rUpfront").textContent = (insLoan ? "" : "±") + rm(dep + ins - insLoan);
    $("rInsLoanRow").hidden = !insLoan; $("rInsLoan").textContent = "+" + rm(insLoan); $("rUpLbl").textContent = insLoan ? L.upDep : L.upBoth;
    const extra = L.sendX(col ? col.n : "-", colP ? rm(colP) : "", rebUsed ? `−${rm(rebUsed)} (${MONTH})` : L.noRebate) + (insLoan ? L.insLoanX(rm(insLoan)) : "");
    $("rSend").href = wa(L.send(g.name, rm(price), depPct, rm(dep), years, rate.toFixed(2), ncdV, rm(monthly)).replace(/(\n[^\n]*OTR[^\n]*)/, "$1" + extra));
  }
  calcSet((byId("vios") || calcModels[0] || M[0]).id);

  /* ---------- PAUTAN DALAM dari halaman harga: /?model=vios#kalkulator atau #model ---------- */
  const wanted = byId(new URLSearchParams(location.search).get("model") || "");
  if (wanted) {
    showModel(wanted.id);
    if (calcModels.includes(wanted)) calcSet(wanted.id);
    // skrip tema boleh menambah seksyen selepas ini; skrol semula ke sasaran bila laman siap dimuat
    const target = location.hash && document.getElementById(location.hash.slice(1));
    const jump = () => {
      // gaya asal: GSAP membalut seksyen yang dipin dalam .pin-spacer (kedudukannya tetap betul)
      const box = target.parentElement.classList.contains("pin-spacer") ? target.parentElement : target;
      scrollTo({ top: box.getBoundingClientRect().top + scrollY - 72, behavior: "instant" });
    };
    if (target) addEventListener("load", () => { setTimeout(jump, 250); setTimeout(jump, 900); });
  }

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
  const A = {};
  /* "Cari Jodoh": satu soalan satu skrin -> saat mencari -> keputusan. Tanpa JS, ketiga-tiga soalan kekal dipaparkan. */
  const quiz = $("quiz"), pick = $("pick"), QS = [...quiz.querySelectorAll(".q")];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ICON = {
    "pax-2": '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M17.5 14c2.1.3 3.5 2 3.5 4.3"/>',
    "pax-5": '<circle cx="7" cy="6.5" r="2.6"/><circle cx="17" cy="6.5" r="2.6"/><circle cx="12" cy="13" r="2"/><path d="M2.5 17c0-3 2-5 4.5-5 1.2 0 2.2.4 3 1.1M21.5 17c0-3-2-5-4.5-5-1.2 0-2.2.4-3 1.1M8.5 20.5c0-2.2 1.5-3.8 3.5-3.8s3.5 1.6 3.5 3.8"/>',
    "pax-7": '<circle cx="12" cy="7" r="2.8"/><circle cx="5" cy="9" r="2.2"/><circle cx="19" cy="9" r="2.2"/><path d="M7 19c0-3.2 2.2-5.4 5-5.4s5 2.2 5 5.4M1.8 17.5c0-2.4 1.4-4 3.2-4 .9 0 1.6.3 2.2.9M22.2 17.5c0-2.4-1.4-4-3.2-4-.9 0-1.6.3-2.2.9"/>',
    "use-city": '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5.5C9 4.7 9.7 4 10.5 4h3c.8 0 1.5.7 1.5 1.5V8M3 13h18"/>',
    "use-far": '<path d="M8 4 4 20M16 4l4 16M12 5v2.5M12 10.8v2.5M12 16.6v2.5"/>',
    "use-work": '<path d="M12 3 20 7v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
    "use-save": '<path d="M12 3.5c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.1 2.5-6.3 6-10.5z"/><path d="M9.5 14.5a2.7 2.7 0 0 0 2.5 2.6"/>'
  };
  // Ikon bajet: 4 bar, makin tinggi bajet makin banyak bar menyala
  const bars = n => [0, 1, 2, 3].map(i => `<path d="M${5 + i * 4.7} 20v-${4 + i * 3.6}"${i < n ? "" : ' opacity=".22"'}/>`).join("");
  ["1200", "1800", "2600", "99999"].forEach((v, i) => ICON["budget-" + v] = bars(i + 1));
  QS.forEach(q => q.querySelectorAll(".opts button").forEach(b => {
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[q.dataset.q + "-" + b.dataset.v] || ""}</svg><span>${b.textContent}</span>`;
    b.setAttribute("aria-pressed", "false");
  }));
  quiz.insertAdjacentHTML("afterbegin", `<div class="jd-bar"><button type="button" class="jd-back">← ${L.jdBack}</button><span class="jd-count" aria-live="polite"></span><div class="jd-prog" aria-hidden="true"><i></i><i></i><i></i></div></div>`);
  quiz.classList.add("jodoh");
  pick.classList.add("jd-off");
  pick.setAttribute("aria-live", "polite");
  let at = 0, busy = 0;
  const go = n => {
    at = n;
    QS.forEach((q, i) => q.classList.toggle("now", i === n));
    quiz.querySelector(".jd-count").textContent = L.jdStep(n + 1);
    quiz.querySelectorAll(".jd-prog i").forEach((el, i) => el.classList.toggle("on", i <= n));
    quiz.querySelector(".jd-back").style.visibility = n ? "visible" : "hidden";
  };
  const find = () => {
    quiz.classList.add("jd-off"); pick.classList.remove("jd-off");
    pick.innerHTML = `<div class="jd-load"><div class="jd-pulse"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.500-4.600-7.500-10.200A4.100 4.100 0 0 1 12 7.300a4.100 4.100 0 0 1 7.500 2.500C19.500 15.400 12 20 12 20z"/></svg></div><p>${L.jdFinding}</p></div>`;
    setTimeout(() => { recommend(); busy = 0; }, calm ? 0 : 1300);
  };
  quiz.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || busy) return;
    if (b.classList.contains("jd-back")) { go(at - 1); return; }
    const q = b.closest(".q"); A[q.dataset.q] = b.dataset.v;
    q.querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    busy = 1;
    const keyboard = e.detail === 0;
    setTimeout(() => {
      if (at === QS.length - 1) { find(); return; }
      go(at + 1); busy = 0;
      if (keyboard) QS[at].querySelector("button").focus({ preventScroll: true });
    }, calm ? 0 : 260);
  });
  const retry = () => {
    for (const k in A) delete A[k];
    quiz.querySelectorAll(".opts button").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
    pick.classList.add("jd-off"); quiz.classList.remove("jd-off"); go(0);
  };
  go(0);
  function recommend() {
    const pax = +A.pax, use = A.use, budget = +A.budget, list = [];
    for (const [id, t] of Object.entries(TAGS)) {
      const m = byId(id); if (!m) continue; // model sudah tiada di senarai Toyota
      m.grades.forEach((g, gi) => {
        let s = 0;
        if (t.pax[0] === pax) s += 3; else if (t.pax.includes(pax)) s += 2; else if (pax === 2 && t.pax.includes(5)) s += 1; else return;
        if (use === "save") { if (g.fuel !== "HEV") return; s += 4; }
        else if (t.use[0] === use) s += 4; else if (t.use.includes(use)) s += 2; else if (use === "work") return;
        list.push({ m, g, gi, s, mo: est(g.price - (g.rebate || 0)) });
      });
    }
    const within = list.filter(x => x.mo <= budget);
    const pool = within.length ? within : list.slice().sort((a, b) => a.mo - b.mo).slice(0, 3);
    pool.sort((a, b) => b.s - a.s || (within.length ? b.mo - a.mo : a.mo - b.mo));
    const best = pool[0];
    if (!best) { $("pick").innerHTML = `<div class="pick-empty"><p class="kicker light">${L.pickK}</p><h3>${L.talkH}</h3><p>${L.talkP}</p><button type="button" class="jd-retry" data-retry>↻ ${L.jdRetry}</button></div>`; return; }
    const seen = new Set([best.m.id]), alts = [];
    for (const x of pool.slice(1)) { if (!seen.has(x.m.id)) { seen.add(x.m.id); alts.push(x); } if (alts.length === 2) break; }
    const over = !within.length;
    $("pick").innerHTML = `<div class="pick-res jd-res">
      <div>
        <p class="jd-match">${L.jdMatch}</p>
        <p class="kicker light">${L.pickK}</p>
        <h3>Toyota ${best.g.name}</h3>
        <p class="why">${L.why[use]}${over ? L.over : ""}</p>
        <div class="mini"><div><b>${rm(best.g.price)}</b><span>${L.otrNoRebate}</span></div><div><b>±${rm(best.mo)}</b><span>${L.perMonth}</span></div></div>
        <div class="hero-cta" style="margin-top:0">
          <button class="btn btn-red" type="button" data-go="${best.m.id}" data-gi="${best.gi}">${L.view}</button>
          <a class="btn btn-wa" target="_blank" rel="noopener" href="${wa(L.pickMsg(best.g.name))}"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3Z"/></svg><span>${L.askWan}</span></a>
        </div>
        ${alts.length ? `<p class="alt">${L.others}: ${alts.map(x => `<button type="button" data-go="${x.m.id}" data-gi="${x.gi}">${x.g.name}</button> (±${rm(x.mo)}${L.mo})`).join(", ")}</p>` : ""}
        <button type="button" class="jd-retry" data-retry>↻ ${L.jdRetry}</button>
      </div>
      <img src="${BASE + best.m.cut}" alt="Toyota ${best.m.name}" width="450" height="190">
    </div>`;
  }
  $("pick").addEventListener("click", e => { if (e.target.closest("[data-retry]")) { retry(); return; } const b = e.target.closest("[data-go]"); if (!b) return; showModel(b.dataset.go, +b.dataset.gi); $("model").scrollIntoView({ behavior: "smooth" }); });

  /* ---------- SENARAI SEMAK ---------- */
  const chk = [...$("checklist").querySelectorAll("button")];
  const chkUpd = () => {
    const n = chk.filter(b => b.getAttribute("aria-pressed") === "true").length;
    $("chkCount").textContent = L.chk(n, chk.length);
    $("chkBar").style.width = (n / chk.length * 100) + "%";
    $("chkLabel").textContent = n === chk.length ? L.chkDone : n ? L.chkSome : L.chkNone;
  };
  chk.forEach(b => b.addEventListener("click", () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); chkUpd(); }));

  /* ---------- PROSES ---------- */
  const STEPS = L.steps;
  $("stepList").innerHTML = STEPS.map((s, i) => `<li><button type="button" data-i="${i}"><b>${String(i + 1).padStart(2, "0")}</b><span>${s[0]}</span></button></li>`).join("");
  const step = i => {
    const s = STEPS[i];
    [...$("stepList").querySelectorAll("button")].forEach((b, j) => b.classList.toggle("on", j === i));
    $("stepDetail").innerHTML = `<div class="num">${String(i + 1).padStart(2, "0")}</div><h3>${s[0]}</h3><p>${s[1]}</p><ul>${s[2].map(x => `<li>${x}</li>`).join("")}</ul><p class="meta">${s[3]}</p>`;
  };
  $("stepList").addEventListener("click", e => { const b = e.target.closest("button"); if (b) step(+b.dataset.i); });
  step(0);
})();
