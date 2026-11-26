// Halaman SEO/GEO statik (harga terus dalam HTML, boleh dibaca Google & alat AI tanpa JavaScript):
//   /harga/ + /harga/<model>/  (BM)   ·   /en/price/ + /en/price/<model>/  (EN)
//   senarai harga dalam index.html & en/index.html (antara penanda SEO-HARGA), llms.txt, sitemap.xml
// Dipanggil oleh scripts/update.mjs selepas data.js ditulis. Boleh jalan sendiri: node scripts/seo.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOME = "https://wanjasni.my";
const WA = "https://wa.me/60163313607";
const TIKTOK = "https://www.tiktok.com/@wan.jasni";
const MARK = "<!-- Dijana oleh scripts/seo.mjs — jangan sunting tangan -->";
// Andaian ansuran = nilai lalai kalkulator laman
const DEP = 10, YEARS = 9, RATE = 2.3;

// id model laman -> id jadual Maxcheck (scripts/maxcheck.py)
const MX = { vios: "vios", yaris: "yaris", "yaris-cross": "yaris-cross-bsuv", corolla: "corolla-altis", "corolla-cross": "corolla-cross", camry: "camry", veloz: "veloz", zenix: "innova-zenix-hev", fortuner: "fortuner", hilux: "hilux", hiace: "hiace", "hiace-slwb": "hiace", harrier: "harrier", bz4x: "bz4x-hev", "urban-cruiser": "urban-cruiser", alphard: "alphard", vellfire: "vellfire", gr86: "gr-86", "gr-yaris": "gr-yaris", "gr-corolla": "gr-corolla" };
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rm = n => "RM" + Math.round(n).toLocaleString("en-MY");
const minColour = g => g.cols && g.cols.length ? Math.min(...g.cols.map(c => c.p || 0)) : 0; // >0 = semua warna berbayar
const monthly = g => { const net = Math.max(0, g.price + minColour(g) - (g.rebate || 0)), loan = net * (1 - DEP / 100); return (loan + loan * RATE / 100 * YEARS) / (YEARS * 12); };
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const BM_MONTH = { January: "Januari", February: "Februari", March: "Mac", May: "Mei", June: "Jun", July: "Julai", August: "Ogos", October: "Oktober", December: "Disember" };

const TXT = {
  ms: {
    dir: "harga", home: "/", locale: "ms-MY", og: "ms_MY",
    privacy: "Laman ni guna Google Analytics (cookies) untuk kira pelawat dan klik butang. Nama atau nombor telefon awak tak dihantar kepada Google Analytics. <a href=\"https://policies.google.com/technologies/partner-sites\" target=\"_blank\" rel=\"noopener\">Cara Google guna data</a>.",
    month: s => s.replace(/[A-Za-z]+/, w => BM_MONTH[w] || w),
    navHome: "Utama", navList: "Semua harga", navCalc: "Kalkulator", wa: "WhatsApp Wan Jasni",
    waMsg: n => `Salam Wan Jasni, saya nak tanya pasal Toyota ${n}.`, waGeneral: "Salam Wan Jasni, saya nak tanya pasal kereta Toyota.",
    type: { Sedan: "Sedan", Hatchback: "Hatchback", SUV: "SUV", MPV: "MPV", Pickup: "Pickup", Van: "Van", Coupe: "Coupe" },
    fuel: { Petrol: "Petrol", HEV: "HEV", Diesel: "Diesel", EV: "Elektrik (EV)" },
    title: (n, y, van) => van ? `Harga Toyota ${n} ${y} | Wan Jasni` : `Harga Toyota ${n} ${y} & Ansuran Bulanan | Wan Jasni`,
    desc: (n, y, from, date, van) => `Harga OTR Toyota ${n} ${y} dari ${from} (Semenanjung, tanpa rebate*), rebate semasa, warna${van ? "" : " dan anggaran ansuran bulanan"}. Semakan ${date}. WhatsApp Wan Jasni.`,
    h1: (n, y) => `Harga Toyota ${n} ${y}`,
    lead: (n, from, to, count, date) => count > 1
      ? `Harga on-the-road Toyota ${n} bermula <b>${from}</b> sampai <b>${to}</b> untuk ${count} varian (Semenanjung, tanpa rebate*, semakan ${date}).`
      : `Harga on-the-road Toyota ${n} ialah <b>${from}</b> (Semenanjung, tanpa rebate*, semakan ${date}).`,
    rebLead: (mo, max) => ` Rebate ${mo} sampai <b>${max}</b>, tertakluk pada terma dan syarat.`,
    noRebLead: mo => ` Setakat semakan ini, tiada rebate ${mo} disenaraikan untuk model ni.`,
    fromMonthly: m => ` Anggaran ansuran bermula <b>±${m} sebulan</b>.`,
    h2Price: van => van ? "Harga ikut varian" : "Harga & ansuran ikut varian",
    th: ["Varian", "Harga OTR tanpa rebate*", "Rebate", "Anggaran sebulan"],
    assume: mo => `Anggaran sebulan: deposit ${DEP}%, loan ${YEARS} tahun, kadar ${RATE.toFixed(2)}% setahun, selepas tolak rebate ${mo} (kalau ada), warna paling murah. Belum masuk insurans. Kelulusan dan kadar sebenar ikut bank.`,
    mustColour: p => `semua warna +${p} ke atas (dah dikira dalam ansuran)`,
    mxLink: "Jadual service Maxcheck",
    calcFull: "Kira ansuran penuh", seePhotos: "Tukar warna & tengok gambar",
    h2Colour: n => `Warna Toyota ${n}`, colourNote: "Gambar sekadar ilustrasi, ikut gambar rasmi Toyota.",
    photoAlt: (n, c) => `Toyota ${n} warna ${c}`,
    h2Faq: n => `Soalan pasal Toyota ${n}`,
    faq: ({ n, y, from, to, count, date, mo, maxReb, minM, minMName, van }) => [
      [`Berapa harga Toyota ${n} ${y}?`, count > 1 ? `Harga on-the-road Toyota ${n} dari ${from} sampai ${to} (Semenanjung, tanpa rebate, dah masuk SST, belum masuk insurans), semakan ${date}.` : `Harga on-the-road Toyota ${n} ialah ${from} (Semenanjung, tanpa rebate, dah masuk SST, belum masuk insurans), semakan ${date}.`],
      ...(van ? [] : [[`Berapa ansuran bulanan Toyota ${n}?`, `Anggaran bermula ±${minM} sebulan untuk ${minMName}, dengan deposit ${DEP}%, loan ${YEARS} tahun dan kadar ${RATE.toFixed(2)}% setahun selepas tolak rebate (kalau ada). Belum masuk insurans. Kadar dan kelulusan sebenar ikut bank.`]]),
      [`Ada rebate untuk Toyota ${n} bulan ni?`, maxReb ? `Ada. Rebate ${mo} untuk Toyota ${n} sampai ${maxReb}, ikut varian dan tertakluk pada terma dan syarat.` : `Setakat semakan ${date}, tiada rebate ${mo} disenaraikan untuk Toyota ${n} di laman Toyota Malaysia. WhatsApp Wan Jasni untuk semak promosi terkini.`],
      [`Nak beli Toyota ${n} di Kuala Langat, hubungi siapa?`, `Wan Jasni, Sales Advisor Toyota di Panglima City Motor Sdn Bhd, Lot 7159, Jalan Klang, Batu 8, 42500 Telok Panglima Garang, Selangor. WhatsApp 016-331 3607. Wan Jasni cover seluruh Semenanjung Malaysia.`]
    ],
    ctaH: n => `Nak harga penuh Toyota ${n} untuk warna pilihan awak?`, ctaP: "WhatsApp je Wan Jasni. Wan Jasni sediakan pecahan harga, rebate bulan ni dan boleh tolong semak loan dengan bank.",
    others: "Harga model Toyota lain", fromW: "dari",
    hubTitle: (mo, y) => `Senarai Harga Toyota ${y} Semenanjung | Wan Jasni`,
    hubDesc: (count, date) => `Senarai harga on-the-road ${count} model Toyota di Semenanjung Malaysia, setiap varian dengan rebate semasa dan anggaran ansuran bulanan. Semakan ${date}.`,
    hubH1: y => `Senarai harga Toyota ${y}`,
    hubLead: (count, vars, date) => `Harga on-the-road rasmi Toyota untuk <b>${count} model (${vars} varian)</b> di Semenanjung Malaysia, semakan ${date}. Tekan nama model untuk tengok warna, soalan lazim dan anggaran ansuran.`,
    homeEye: "Senarai harga", homeH2: mo => `<b>Harga Toyota</b> ${mo}`,
    homeSub: date => `Harga on-the-road bermula, tanpa rebate*, Semenanjung Malaysia, semakan ${date}. Tekan model untuk harga setiap varian dan anggaran ansuran.`,
    homeAll: "Tengok senarai harga penuh →",
    updated: d => `Dikemas kini: ${d}`,
    foot: date => `*Harga boleh berubah bila-bila masa dari tarikh laman ini dikemas kini. Harga berdasarkan untuk Semenanjung Malaysia sahaja. Harga on-the-road (Individual Private) dah masuk SST, belum masuk insurans dan belum tolak rebate, ikut senarai harga di laman Toyota Malaysia (semakan ${date}). Rebate, warna dan kiraan loan tertakluk pada terma dan syarat serta kelulusan bank. Ini laman peribadi Wan Jasni, bukan laman rasmi UMW Toyota Motor.`
  },
  en: {
    dir: "en/price", home: "/en/", locale: "en-MY", og: "en_MY",
    privacy: "This site uses Google Analytics (cookies) to count visitors and button taps. Your name and phone number are not sent to Google Analytics. <a href=\"https://policies.google.com/technologies/partner-sites\" target=\"_blank\" rel=\"noopener\">How Google uses data</a>.",
    month: s => s,
    navHome: "Home", navList: "All prices", navCalc: "Calculator", wa: "WhatsApp Wan Jasni",
    waMsg: n => `Hi Wan Jasni, I'd like to ask about the Toyota ${n}.`, waGeneral: "Hi Wan Jasni, I'd like to ask about a Toyota.",
    type: { Sedan: "Sedan", Hatchback: "Hatchback", SUV: "SUV", MPV: "MPV", Pickup: "Pickup", Van: "Van", Coupe: "Coupe" },
    fuel: { Petrol: "Petrol", HEV: "HEV", Diesel: "Diesel", EV: "Electric (EV)" },
    title: (n, y, van) => van ? `Toyota ${n} Price ${y} Malaysia | Wan Jasni` : `Toyota ${n} Price ${y} & Monthly Instalment | Wan Jasni`,
    desc: (n, y, from, date, van) => `Toyota ${n} ${y} on-the-road price from ${from} (Peninsular Malaysia, before rebate*), current rebate, colours${van ? "" : " and estimated monthly instalment"}. Checked ${date}.`,
    h1: (n, y) => `Toyota ${n} price ${y}`,
    lead: (n, from, to, count, date) => count > 1
      ? `The Toyota ${n} on-the-road price ranges from <b>${from}</b> to <b>${to}</b> across ${count} variants (Peninsular Malaysia, before rebate*, checked ${date}).`
      : `The Toyota ${n} on-the-road price is <b>${from}</b> (Peninsular Malaysia, before rebate*, checked ${date}).`,
    rebLead: (mo, max) => ` The ${mo} rebate is up to <b>${max}</b>, subject to terms and conditions.`,
    noRebLead: mo => ` At the time of checking, no ${mo} rebate is listed for this model.`,
    fromMonthly: m => ` Estimated instalments start at <b>±${m} a month</b>.`,
    h2Price: van => van ? "Prices by variant" : "Prices and instalments by variant",
    th: ["Variant", "OTR price before rebate*", "Rebate", "Estimated monthly"],
    assume: mo => `Monthly estimate: ${DEP}% deposit, ${YEARS}-year loan, ${RATE.toFixed(2)}% flat rate per year, after the ${mo} rebate (if any), with the lowest-priced colour. Excludes insurance. Actual rate and approval depend on the bank.`,
    mustColour: p => `every colour adds ${p} or more (included in monthly)`,
    mxLink: "Maxcheck service schedule",
    calcFull: "Full instalment calculator", seePhotos: "Switch colours & see photos",
    h2Colour: n => `Toyota ${n} colours`, colourNote: "Pictures are for illustration, from Toyota's official images.",
    photoAlt: (n, c) => `Toyota ${n} in ${c}`,
    h2Faq: n => `Toyota ${n} questions`,
    faq: ({ n, y, from, to, count, date, mo, maxReb, minM, minMName, van }) => [
      [`How much is the Toyota ${n} ${y}?`, count > 1 ? `The Toyota ${n} on-the-road price is ${from} to ${to} (Peninsular Malaysia, before rebate, including SST, excluding insurance), checked ${date}.` : `The Toyota ${n} on-the-road price is ${from} (Peninsular Malaysia, before rebate, including SST, excluding insurance), checked ${date}.`],
      ...(van ? [] : [[`What is the monthly instalment for a Toyota ${n}?`, `Estimates start at about ${minM} a month for the ${minMName}, with a ${DEP}% deposit over ${YEARS} years at ${RATE.toFixed(2)}% a year, after rebate (if any). Insurance is not included. The actual rate and approval depend on the bank.`]]),
      [`Is there a rebate on the Toyota ${n} this month?`, maxReb ? `Yes. The ${mo} rebate on the Toyota ${n} is up to ${maxReb}, depending on the variant and subject to terms and conditions.` : `At the time of checking (${date}), no ${mo} rebate is listed for the Toyota ${n} on the Toyota Malaysia website. Message Wan Jasni for the latest promotions.`],
      [`Who can I buy a Toyota ${n} from in Kuala Langat?`, `Wan Jasni, Toyota Sales Advisor at Panglima City Motor Sdn Bhd, Lot 7159, Jalan Klang, Batu 8, 42500 Telok Panglima Garang, Selangor. WhatsApp +60 16-331 3607. Wan Jasni covers the whole of Peninsular Malaysia.`]
    ],
    ctaH: n => `Want the full Toyota ${n} price for your colour?`, ctaP: "WhatsApp Wan Jasni for a full price breakdown, this month's rebate and help checking your loan with the bank.",
    others: "Other Toyota model prices", fromW: "from",
    hubTitle: (mo, y) => `Toyota Price List ${y} Malaysia | Wan Jasni`,
    hubDesc: (count, date) => `On-the-road prices for ${count} Toyota models in Peninsular Malaysia, every variant with current rebate and estimated monthly instalment. Checked ${date}.`,
    hubH1: y => `Toyota price list ${y}`,
    hubLead: (count, vars, date) => `Official Toyota on-the-road prices for <b>${count} models (${vars} variants)</b> in Peninsular Malaysia, checked ${date}. Select a model for colours, common questions and instalment estimates.`,
    homeEye: "Price list", homeH2: mo => `<b>Toyota prices</b> ${mo}`,
    homeSub: date => `Starting on-the-road prices before rebate*, Peninsular Malaysia, checked ${date}. Select a model for every variant and instalment estimates.`,
    homeAll: "See the full price list →",
    updated: d => `Updated: ${d}`,
    foot: date => `*Prices may change at any time after the date this site was updated. Prices apply to Peninsular Malaysia only. OTR prices (Individual Private) include SST, without insurance and without rebate, based on the price list on the Toyota Malaysia website (checked ${date}). Rebates, colours and loan figures are subject to terms and conditions and bank approval. This site is run personally by a sales advisor and is not an official UMW Toyota Motor website.`
  }
};

const WAICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3Z"/></svg>';
const waLink = msg => `${WA}?text=${encodeURIComponent(msg)}`;
const waBtn = (msg, label, cls = "") => `<a class="p-btn p-wa ${cls}" href="${esc(waLink(msg))}" target="_blank" rel="noopener">${WAICO}<span>${label}</span></a>`;
const urlOf = (lang, id) => `/${TXT[lang].dir}/${id ? id + "/" : ""}`;

// Rangka halaman statik (satu gaya cerah yang kemas; tidak perlukan JavaScript)
function shell(lang, { id, title, desc, body, jsonld, date, waMsg, v, paths, head = "", scripts = "", bodyClass = "" }) {
  const T = TXT[lang], other = lang === "ms" ? "en" : "ms";
  const P = paths || { ms: urlOf("ms", id), en: urlOf("en", id) };
  const self = HOME + P[lang];
  return `<!doctype html>
${MARK}
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${self}">
<link rel="alternate" hreflang="ms" href="${HOME + P.ms}">
<link rel="alternate" hreflang="en" href="${HOME + P.en}">
<link rel="alternate" hreflang="x-default" href="${HOME + P.ms}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${T.og}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${HOME}/img/og.jpg?v=3">
<meta property="og:url" content="${self}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/icon-32.png?v=2" type="image/png" sizes="32x32">
<link rel="icon" href="/img/icon-192.png?v=2" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png?v=2">
<link rel="manifest" href="/manifest.webmanifest">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/pages.css?v=${v}">
<script src="/analytics.js?v=1" defer></script>
${head}${jsonld.map(ld).join("\n")}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<header class="p-top">
  <a class="p-brand" href="${T.home}"><img src="/img/toyota-emblem.svg" alt="Toyota" width="34" height="22"><span>Wan Jasni</span></a>
  <nav class="p-nav"><a href="${urlOf(lang)}">${T.navList}</a><a class="p-hide" href="${T.home}#kalkulator">${T.navCalc}</a></nav>
  <a class="p-mx" href="/maxcheck/"${bodyClass === "mx-page" ? ' aria-current="page"' : ""}>Maxcheck</a>
  <div class="p-lang"><a href="${P.ms}"${lang === "ms" ? ' aria-current="page"' : ""} hreflang="ms">BM</a><a href="${P.en}"${lang === "en" ? ' aria-current="page"' : ""} hreflang="en">EN</a></div>
  <a class="p-tt" href="${TIKTOK}" target="_blank" rel="noopener" aria-label="TikTok @wan.jasni"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.1v12.4a2.6 2.6 0 1 1-1.9-2.5V9.7a5.7 5.7 0 1 0 5 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6Z"/></svg></a>
  ${waBtn(waMsg, `<span class="p-hide">${T.wa}</span>`, "p-top-wa")}
</header>
<main class="p-wrap">
${body}
</main>
<footer class="p-foot">
  <div class="p-wrap">
    <div class="p-me"><img src="/img/wan-card.webp?v=1" alt="Wan Jasni, Toyota Sales Advisor" width="64" height="84" loading="lazy">
      <div><b>Wan Jasni</b><span>Toyota Sales Advisor · Panglima City Motor Sdn Bhd</span><span>Lot 7159, Jalan Klang, Batu 8, 42500 Telok Panglima Garang, Selangor</span></div></div>
    ${waBtn(waMsg, "WhatsApp 016-331 3607")}
    <p>${T.foot(date)}</p>
    <p>${T.privacy}</p>
  </div>
</footer>
${scripts}</body>
</html>
`;
}

const crumbs = items => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: HOME + url })) });
const gradeRows = (lang, m) => {
  const T = TXT[lang], van = m.type === "Van";
  return m.grades.map(g => `<tr><th scope="row">${esc(g.name)}<small>${T.fuel[g.fuel] || esc(g.fuel)}${!van && minColour(g) ? " · " + T.mustColour(rm(minColour(g))) : ""}</small></th><td>${rm(g.price)}</td><td class="p-reb">${g.rebate ? "−" + rm(g.rebate) : "–"}</td>${van ? "" : `<td><b>±${rm(monthly(g))}</b></td>`}</tr>`).join("\n");
};
const priceTable = (lang, m, caption) => {
  const T = TXT[lang], heads = m.type === "Van" ? T.th.slice(0, 3) : T.th;
  return `<div class="p-table"><table><caption class="p-sr">${esc(caption)}</caption><thead><tr>${heads.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>
${gradeRows(lang, m)}
</tbody></table></div>`;
};

function modelPage(lang, D, m, ctx) {
  const T = TXT[lang], n = m.name, van = m.type === "Van";
  const prices = m.grades.map(g => g.price), from = rm(Math.min(...prices)), to = rm(Math.max(...prices));
  const maxRebN = Math.max(0, ...m.grades.map(g => g.rebate || 0)), maxReb = maxRebN ? rm(maxRebN) : "";
  const cheapest = [...m.grades].sort((a, b) => monthly(a) - monthly(b))[0];
  const facts = { n, y: ctx.year, from, to, count: m.grades.length, date: ctx.date[lang], mo: ctx.month[lang], maxReb, minM: rm(monthly(cheapest)), minMName: cheapest.name, van };
  const faq = T.faq(facts);

  // Gambar warna: satu setiap nama warna (tanpa gambar ilustrasi keluarga)
  const shots = new Map();
  for (const g of m.grades) for (const c of g.cols || []) if (c.img && !c.illus && !shots.has(c.n)) shots.set(c.n, c);
  // Kumpulkan varian yang senarai warnanya sama
  const groups = new Map();
  for (const g of m.grades) {
    if (!g.cols || !g.cols.length) continue;
    const key = g.cols.map(c => c.n + "|" + (c.p || 0)).sort().join(";");
    (groups.get(key) || groups.set(key, { names: [], cols: g.cols }).get(key)).names.push(g.name);
  }
  const colourBlocks = [...groups.values()].map(gr => `<div class="p-colgroup"><h3>${gr.names.map(esc).join(" · ")}</h3><ul class="p-chips">${gr.cols.map(c => `<li><i style="background:${esc(c.hex || "#999")}"></i>${esc(c.n)}${c.p ? ` <em>+${rm(c.p)}</em>` : ""}</li>`).join("")}</ul></div>`).join("\n");
  const gallery = [...shots.values()].slice(0, 8).map(c => `<figure><img src="/${esc(c.img)}" alt="${esc(T.photoAlt(n, c.n))}" loading="lazy" width="900" height="450"><figcaption>${esc(c.n)}</figcaption></figure>`).join("");

  const others = D.models.filter(x => x.id !== m.id).map(x => `<a href="${urlOf(lang, x.id)}"><img src="/${esc(x.cut)}" alt="" loading="lazy" width="150" height="60"><b>${esc(x.name)}</b><span>${T.fromW} ${rm(Math.min(...x.grades.map(g => g.price)))}*</span></a>`).join("");

  const body = `<nav class="p-crumb" aria-label="Breadcrumb"><a href="${T.home}">${T.navHome}</a> › <a href="${urlOf(lang)}">${T.navList}</a> › <span>Toyota ${esc(n)}</span></nav>
<section class="p-hero">
  <p class="p-eye">${T.type[m.type] || esc(m.type)} · ${T.updated(ctx.date[lang])}</p>
  <h1>${T.h1(esc(n), ctx.year)}</h1>
  <p class="p-lead">${T.lead(esc(n), from, to, m.grades.length, ctx.date[lang])}${maxReb ? T.rebLead(ctx.month[lang], maxReb) : T.noRebLead(ctx.month[lang])}${van ? "" : T.fromMonthly(rm(monthly(cheapest)))}</p>
  <img class="p-car" src="/${esc(m.cut)}" alt="Toyota ${esc(n)} ${ctx.year}" width="720" height="300" fetchpriority="high">
</section>
<section>
  <h2>${T.h2Price(van)}</h2>
  ${priceTable(lang, m, `Toyota ${n}: ${T.h2Price(van)}`)}
  ${van ? "" : `<p class="p-note">${T.assume(ctx.month[lang])}</p>`}
  <div class="p-actions">${van ? "" : `<a class="p-btn p-blue" href="${T.home}?model=${m.id}#kalkulator">${T.calcFull}</a>`}<a class="p-btn p-ghost" href="${T.home}?model=${m.id}#model">${T.seePhotos}</a>${MX[m.id] ? `<a class="p-btn p-ghost" href="/maxcheck/?model=${MX[m.id]}">${T.mxLink}</a>` : ""}${waBtn(T.waMsg(n), T.wa)}</div>
</section>
${colourBlocks ? `<section>
  <h2>${T.h2Colour(esc(n))}</h2>
  ${gallery ? `<div class="p-gallery">${gallery}</div><p class="p-note">${T.colourNote}</p>` : ""}
  ${colourBlocks}
</section>` : ""}
<section>
  <h2>${T.h2Faq(esc(n))}</h2>
  ${faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n  ")}
</section>
<section class="p-cta">
  <h2>${T.ctaH(esc(n))}</h2>
  <p>${T.ctaP}</p>
  ${waBtn(T.waMsg(n), T.wa)}
</section>
<section>
  <h2>${T.others}</h2>
  <div class="p-grid">${others}</div>
</section>`;

  const carLd = {
    "@context": "https://schema.org", "@type": "Car", name: `Toyota ${n} ${ctx.year}`, brand: { "@type": "Brand", name: "Toyota" }, model: n,
    bodyType: m.type, image: `${HOME}/${m.cut}`, url: HOME + urlOf(lang, m.id),
    offers: { "@type": "AggregateOffer", priceCurrency: "MYR", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: m.grades.length, areaServed: "Peninsular Malaysia",
      seller: { "@type": "AutoDealer", name: "Panglima City Motor Sdn Bhd", telephone: "+60163313607", url: HOME + "/" } }
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return shell(lang, { id: m.id, title: T.title(n, ctx.year, van), desc: T.desc(n, ctx.year, from, ctx.date[lang], van), body,
    jsonld: [crumbs([[T.navHome, T.home], [T.navList, urlOf(lang)], ["Toyota " + n, urlOf(lang, m.id)]]), carLd, faqLd], date: ctx.date[lang], waMsg: T.waMsg(n), v: ctx.v });
}

// SATU halaman /maxcheck/ (arahan Wan): English secara lalai, butang BM | EN tukar bahasa di halaman sama (?lang=bm)
function maxcheckPage(MXD, ctx, root) {
  const E = TXT.en, M = TXT.ms, url = HOME + "/maxcheck/";
  const n = MXD.groups.reduce((a, g) => a + g.models.length, 0);
  const day = loc => new Date(MXD.checkedAt + "T00:00:00Z").toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dEn = day("en-GB"), dBm = day("ms-MY");
  const stamp = f => { const t = readFileSync(path.join(root, f), "utf8").replace(/\r/g, ""); return [...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36); };
  // dua bahasa dalam HTML: .l-en dipapar secara lalai, .l-bm bila html.bm
  const L = (en, bm) => `<span class="l-en">${en}</span><span class="l-bm" lang="ms">${bm}</span>`;
  const A = (cls, enHref, bmHref, en, bm, extra = "") => `<a class="l-en ${cls}" href="${enHref}"${extra}>${en}</a><a class="l-bm ${cls}" lang="ms" href="${bmHref}"${extra}>${bm}</a>`;
  const ext = ' target="_blank" rel="noopener"';
  const waTop = A("p-btn p-wa p-top-wa", esc(waLink(E.waGeneral)), esc(waLink(M.waGeneral)), `${WAICO}<span class="p-hide">${E.wa}</span>`, `${WAICO}<span class="p-hide">${M.wa}</span>`, ext);
  const waFoot = A("p-btn p-wa", esc(waLink(E.waGeneral)), esc(waLink(M.waGeneral)), `${WAICO}<span>WhatsApp 016-331 3607</span>`, `${WAICO}<span>WhatsApp 016-331 3607</span>`, ext);
  const title = `Toyota Maxcheck Service Schedule ${ctx.year} for Every Model | Wan Jasni`;
  const titleBm = `Jadual Service Maxcheck Toyota ${ctx.year} Setiap Model | Wan Jasni`;
  const desc = `Toyota Maxcheck periodic service schedules for ${n} models by model code: intervals, parts, labour and package prices. View instantly, no download. Jadual service Maxcheck setiap model.`;
  return `<!doctype html>
${MARK}
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<script>(function(){var l=new URLSearchParams(location.search).get("lang");if(l==="bm"||l==="ms"){var h=document.documentElement;h.className="bm";h.lang="ms";document.title=${JSON.stringify(titleBm)};}})();</script>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_MY">
<meta property="og:locale:alternate" content="ms_MY">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${HOME}/img/og.jpg?v=3">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/icon-32.png?v=2" type="image/png" sizes="32x32">
<link rel="icon" href="/img/icon-192.png?v=2" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png?v=2">
<link rel="manifest" href="/manifest.webmanifest">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/pages.css?v=${ctx.v}">
<link rel="stylesheet" href="/maxcheck.css?v=${stamp("maxcheck.css")}">
<script src="/analytics.js?v=1" defer></script>
${ld(crumbs([["Home", "/en/"], ["Maxcheck", "/maxcheck/"]]))}
</head>
<body class="mx-page">
<header class="p-top">
  ${A("p-brand", "/en/", "/", '<img src="/img/toyota-emblem.svg" alt="Toyota" width="34" height="22"><span>Wan Jasni</span>', '<img src="/img/toyota-emblem.svg" alt="Toyota" width="34" height="22"><span>Wan Jasni</span>')}
  <nav class="p-nav">${A("", E.home.replace(/\/$/, "/") + "price/", "/harga/", E.navList, M.navList)}${A("p-hide", "/en/#kalkulator", "/#kalkulator", E.navCalc, M.navCalc)}</nav>
  <a class="p-mx" href="/maxcheck/" aria-current="page">Maxcheck</a>
  <div class="p-lang" role="group" aria-label="Language / Bahasa"><a href="/maxcheck/?lang=bm" data-lang="bm" lang="ms">BM</a><a href="/maxcheck/" data-lang="en" aria-current="page">EN</a></div>
  <a class="p-tt" href="${TIKTOK}" target="_blank" rel="noopener" aria-label="TikTok @wan.jasni"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.1v12.4a2.6 2.6 0 1 1-1.9-2.5V9.7a5.7 5.7 0 1 0 5 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6Z"/></svg></a>
  ${waTop}
</header>
<main class="p-wrap">
<nav class="p-crumb" aria-label="Breadcrumb">${A("", "/en/", "/", E.navHome, M.navHome)} › <span>Maxcheck</span></nav>
<section id="maxcheck">
  <div class="p-hero">
    <p class="p-eye">Service · ${L(E.updated(dEn), M.updated(dBm))}</p>
    <h1>${L("Toyota Maxcheck service schedule", "Jadual service Maxcheck Toyota")}</h1>
    <p class="p-lead">${L(`Choose your model to see its Maxcheck periodic service schedule straight away, no download needed. Based on Maxcheck on the Toyota Malaysia website (checked ${dEn}), subject to change by Toyota without notice.`, `Tekan model kereta awak, terus keluar jadual service berkala Maxcheck, tak perlu download. Rujukan Maxcheck di laman Toyota Malaysia (semakan ${dBm}), tertakluk pada perubahan oleh Toyota tanpa notis.`)}</p>
  </div>
  <div class="mx-list" id="mxList">${MXD.groups.map(g => `<div class="mx-group"><h3>${esc(g.name === "OTHERS" ? "Others" : g.name)}</h3><div class="mx-models">${g.models.map(m => `<button type="button" data-id="${m.id}">${esc(m.name)}</button>`).join("")}</div></div>`).join("")}</div>
  <div class="mx-view" id="mxView" hidden></div>
  <noscript><p class="p-note">Enable JavaScript to view the schedules, or open the Maxcheck page on the Toyota Malaysia website.</p></noscript>
  <p class="mx-src"><a href="${esc(MXD.source)}" target="_blank" rel="noopener">${L("Source: Maxcheck on the Toyota Malaysia website ›", "Sumber: Maxcheck di laman Toyota Malaysia ›")}</a></p>
</section>
</main>
<footer class="p-foot">
  <div class="p-wrap">
    <div class="p-me"><img src="/img/wan-card.webp?v=1" alt="Wan Jasni, Toyota Sales Advisor" width="64" height="84" loading="lazy">
      <div><b>Wan Jasni</b><span>Toyota Sales Advisor · Panglima City Motor Sdn Bhd</span><span>Lot 7159, Jalan Klang, Batu 8, 42500 Telok Panglima Garang, Selangor</span></div></div>
    ${waFoot}
    <p>${L(E.foot(ctx.date.en), M.foot(ctx.date.ms))}</p>
    <p>${L(E.privacy, M.privacy)}</p>
  </div>
</footer>
<script src="/maxcheck/data.js?v=${stamp("maxcheck/data.js")}"></script>
<script src="/maxcheck-ui.js?v=${stamp("maxcheck-ui.js")}"></script>
</body>
</html>
`;
}

function hubPage(lang, D, ctx) {
  const T = TXT[lang], vars = D.models.reduce((a, m) => a + m.grades.length, 0);
  const body = `<nav class="p-crumb" aria-label="Breadcrumb"><a href="${T.home}">${T.navHome}</a> › <span>${T.navList}</span></nav>
<section class="p-hero">
  <p class="p-eye">${T.updated(ctx.date[lang])} · Rebate ${ctx.month[lang]}</p>
  <h1>${T.hubH1(ctx.year)}</h1>
  <p class="p-lead">${T.hubLead(D.models.length, vars, ctx.date[lang])}</p>
  <p class="p-jump">${D.models.map(m => `<a href="#${m.id}">${esc(m.name)}</a>`).join("")}</p>
</section>
${D.models.map(m => `<section id="${m.id}">
  <h2><a href="${urlOf(lang, m.id)}">Toyota ${esc(m.name)} ›</a></h2>
  ${priceTable(lang, m, "Toyota " + m.name)}
</section>`).join("\n")}
<p class="p-note">${T.assume(ctx.month[lang])}</p>
<div class="p-actions"><a class="p-btn p-blue" href="${T.home}#kalkulator">${T.calcFull}</a>${waBtn(T.waGeneral, T.wa)}</div>`;
  const listLd = { "@context": "https://schema.org", "@type": "ItemList", name: T.hubH1(ctx.year), itemListElement: D.models.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: "Toyota " + m.name, url: HOME + urlOf(lang, m.id) })) };
  return shell(lang, { id: "", title: T.hubTitle(ctx.month[lang], ctx.year), desc: T.hubDesc(D.models.length, ctx.date[lang]), body,
    jsonld: [crumbs([[T.navHome, T.home], [T.navList, urlOf(lang)]]), listLd], date: ctx.date[lang], waMsg: T.waGeneral, v: ctx.v });
}

// Senarai harga ringkas dalam halaman utama (HTML statik)
function homeBlock(lang, D, ctx) {
  const T = TXT[lang];
  return `<!-- SEO-HARGA:START (dijana oleh scripts/seo.mjs) -->
<section class="sec light-sec" id="harga">
  <div class="wrap">
    <p class="eyebrow">${T.homeEye}</p>
    <h2>${T.homeH2(ctx.month[lang])}</h2>
    <p class="sub">${T.homeSub(ctx.date[lang])}</p>
    <ul class="price-index">
${D.models.map(m => `      <li><a href="${urlOf(lang, m.id).slice(lang === "en" ? 4 : 1)}"><b>Toyota ${esc(m.name)}</b><span>${T.fromW} ${rm(Math.min(...m.grades.map(g => g.price)))}*</span></a></li>`).join("\n")}
    </ul>
    <p class="price-all"><a href="${urlOf(lang).slice(lang === "en" ? 4 : 1)}">${T.homeAll}</a></p>
  </div>
</section>
<!-- SEO-HARGA:END -->`;
}

function llmsTxt(D, ctx) {
  const lines = D.models.map(m => {
    const p = m.grades.map(g => g.price), lo = Math.min(...p), hi = Math.max(...p), reb = Math.max(0, ...m.grades.map(g => g.rebate || 0));
    return `- [Toyota ${m.name}](${HOME}/en/price/${m.id}/): ${m.type}, OTR ${rm(lo)}${hi !== lo ? " to " + rm(hi) : ""} (${m.grades.length} variant${m.grades.length > 1 ? "s" : ""})${reb ? `, ${ctx.month.en} rebate up to ${rm(reb)}` : ""}. Bahasa Malaysia: ${HOME}/harga/${m.id}/`;
  });
  return `# Wan Jasni, Toyota Sales Advisor (Telok Panglima Garang, Kuala Langat, Selangor)

> Wan Jasni is a Toyota Sales Advisor at Panglima City Motor Sdn Bhd, Lot 7159, Jalan Klang, Batu 8, 42500 Telok Panglima Garang, Selangor, Malaysia. Wan Jasni covers the whole of Peninsular Malaysia. WhatsApp: +60 16-331 3607. TikTok: ${TIKTOK}. This is a personal sales advisor website, not an official UMW Toyota Motor website.

Price facts (data checked ${ctx.date.en}):
- Prices are Toyota Malaysia on-the-road (Individual Private) prices for Peninsular Malaysia, including SST, excluding insurance, before any rebate.
- Rebates are the ${ctx.month.en} rebates listed on the Toyota Malaysia website, subject to terms and conditions.
- Monthly instalment figures on the model pages are estimates (${DEP}% deposit, ${YEARS} years, ${RATE.toFixed(2)}% flat rate per year). Bank approval and actual rates vary.
- Prices may change at any time. When quoting a price, include the checked date.
- Sources: ${D.source} and ${D.rebateSource}

## Pages
- [Home, loan calculator and model finder (Bahasa Malaysia)](${HOME}/)
- [Home (English)](${HOME}/en/)
- [Full Toyota price list (English)](${HOME}/en/price/)
- [Senarai harga penuh Toyota (Bahasa Malaysia)](${HOME}/harga/)
- [Toyota Maxcheck periodic service schedules by model](${HOME}/maxcheck/) (English; Bahasa Malaysia: ${HOME}/maxcheck/?lang=bm)

## Toyota models
${lines.join("\n")}
`;
}

function sitemap(D, lastmod) {
  const pair = (ms, en) => [ms, en].map(loc => `  <url><loc>${HOME}${loc}</loc><lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="ms" href="${HOME}${ms}"/><xhtml:link rel="alternate" hreflang="en" href="${HOME}${en}"/></url>`).join("\n");
  const rows = [pair("/", "/en/"), pair(urlOf("ms"), urlOf("en")), ...D.models.map(m => pair(urlOf("ms", m.id), urlOf("en", m.id)))];
  rows.splice(1, 0, `  <url><loc>${HOME}/maxcheck/</loc><lastmod>${lastmod}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows.join("\n")}
</urlset>
`;
}

export function buildSeo(root, data) {
  let D = data;
  if (!D) { const c = { window: {} }; vm.runInNewContext(readFileSync(path.join(root, "data.js"), "utf8"), c); D = c.window.TOYOTA; }
  if (!D || !D.models || D.models.length < 8) throw new Error("Data model tak cukup; halaman SEO tidak diubah.");
  const when = new Date((D.checkedAt || D.updatedAt) + "T00:00:00Z");
  const fmt = loc => when.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const monthEn = D.rebateMonth || when.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const cssFile = path.join(root, "pages.css");
  const v = existsSync(cssFile) ? [...readFileSync(cssFile, "utf8").replace(/\r/g, "")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36) : "1";
  const ctx = { year: when.getUTCFullYear(), date: { ms: fmt("ms-MY"), en: fmt("en-GB") }, month: { ms: TXT.ms.month(monthEn), en: monthEn }, v };
  const write = (rel, txt) => { const f = path.join(root, rel); mkdirSync(path.dirname(f), { recursive: true }); const old = existsSync(f) ? readFileSync(f, "utf8").replace(/\r\n/g, "\n") : null; if (old !== txt) writeFileSync(f, txt); };

  let pages = 0;
  for (const lang of ["ms", "en"]) {
    const dir = TXT[lang].dir;
    write(`${dir}/index.html`, hubPage(lang, D, ctx)); pages++;
    for (const m of D.models) { write(`${dir}/${m.id}/index.html`, modelPage(lang, D, m, ctx)); pages++; }
    // Buang halaman model yang sudah tiada dalam data (hanya folder yang dijana oleh skrip ini)
    const ids = new Set(D.models.map(m => m.id));
    for (const e of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (!e.isDirectory() || ids.has(e.name)) continue;
      const sub = path.join(root, dir, e.name), files = readdirSync(sub);
      if (files.length === 1 && files[0] === "index.html" && readFileSync(path.join(sub, "index.html"), "utf8").includes(MARK)) { rmSync(sub, { recursive: true }); console.log("Halaman lama dibuang:", dir + "/" + e.name); }
    }
  }
  for (const [lang, rel] of [["ms", "index.html"], ["en", "en/index.html"]]) {
    const f = path.join(root, rel), a = readFileSync(f, "utf8"), re = /<!-- SEO-HARGA:START[\s\S]*?<!-- SEO-HARGA:END -->/;
    if (!re.test(a)) throw new Error("Penanda SEO-HARGA tiada dalam " + rel);
    const b = a.replace(re, () => homeBlock(lang, D, ctx));
    if (b !== a) writeFileSync(f, b);
  }
  const mxFile = path.join(root, "maxcheck", "data.js");
  if (existsSync(mxFile)) {
    const c = { window: {} }; vm.runInNewContext(readFileSync(mxFile, "utf8"), c);
    write("maxcheck/index.html", maxcheckPage(c.window.MAXCHECK, ctx, root)); pages += 1;
  }
  write("llms.txt", llmsTxt(D, ctx));
  write("sitemap.xml", sitemap(D, D.updatedAt || D.checkedAt));
  console.log(`SEO: ${pages} halaman harga, senarai harga halaman utama, llms.txt, sitemap.xml`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) buildSeo(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
