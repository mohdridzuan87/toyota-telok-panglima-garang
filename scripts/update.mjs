// Kemas kini automatik data laman (data.js + img/col) dari laman rasmi Toyota Malaysia:
//   model, varian & harga OTR (price-list), rebate (monthly-promo), warna + gambar (laman model),
//   harga tambahan warna (jadual "Colours Availability" dalam PDF senarai harga, dibaca dengan pdftotext).
// Dijalankan oleh GitHub Actions (1hb, 7hb, 15hb, 28hb) atau manual: node scripts/update.mjs
// Jika sumber utama gagal, data.js lama dikekalkan (skrip keluar dengan ralat, tiada fail ditulis).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.toyota.com.my";
const PRICE_LIST = SITE + "/en/price-and-model-tools/price-list.html";
const PROMO = SITE + "/en/promotions/monthly-promo.html";
const UA = { headers: { "User-Agent": "Mozilla/5.0 (wanjasni toyota site updater)" } };
const DATA = path.join(ROOT, "data.js"), CACHE = path.join(ROOT, "data", "pdf-cache.json"), COLDIR = path.join(ROOT, "img", "col");

// Model yang TIDAK dipaparkan (peraturan kandungan Wan): GR prestasi, EV, Alphard, Vellfire
// Wan minta SEMUA model dipaparkan (24 Nov 2026); tambah id di sini jika mahu sembunyikan model tertentu
const EXCLUDE_SEG = new Set([]);
const EXCLUDE_GRADE = /^$/;
const EV_SEG = new Set(["bz4x", "urban-cruiser"]);
const TYPE_BY_DESC = { coupe: "Coupe", hatchback: "Hatchback", sedan: "Sedan", suv: "SUV", crossover: "SUV", "premium suv": "SUV", mpv: "MPV", pickup: "Pickup", van: "Van" };
const NICE = { gr86: "GR86", "gr-corolla": "GR Corolla", "gr-yaris": "GR Yaris", bz4x: "bZ4X", "urban-cruiser": "Urban Cruiser", alphard: "Alphard", vellfire: "Vellfire", vios: "Vios", yaris: "Yaris", "yaris-cross": "Yaris Cross", corolla: "Corolla", "corolla-cross": "Corolla Cross", camry: "Camry", veloz: "Veloz", zenix: "Innova Zenix", fortuner: "Fortuner", hilux: "Hilux", hiace: "Hiace", "hiace-slwb": "Hiace SLWB", harrier: "Harrier" };
const TYPE_BY_TAB = { sedan: "Sedan", suv: "SUV", hatchback: "Hatchback", mpv: "MPV", "pick-up-and-van": "Pickup" };
const ORDER = ["vios", "yaris", "yaris-cross", "corolla", "corolla-cross", "camry", "veloz", "zenix", "fortuner", "hilux", "hiace", "hiace-slwb", "harrier", "bz4x", "urban-cruiser", "alphard", "vellfire", "gr86", "gr-yaris", "gr-corolla"];

const get = async u => { const r = await fetch(u, UA); if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return r; };
const jsonVar = (html, name) => { const m = html.match(new RegExp("window\\." + name + "\\s*=\\s*(\\{[\\s\\S]*?\\});\\s*(?:\\n|<\\/script>)")); return m ? JSON.parse(m[1]) : null; };
const rmNum = s => { const m = String(s || "").match(/RM\s?([\d,]+)(?:\.\d+)?/i); return m ? Math.round(+m[1].replace(/,/g, "")) : 0; };
const titleCase = s => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/\b(Hev|Slwb|Gr|Vrz|Srz|At|Mt)\b/g, w => w.toUpperCase());
const prevData = (() => { try { const c = { window: {} }; vm.runInNewContext(readFileSync(DATA, "utf8"), c); return c.window.TOYOTA; } catch { return null; } })();
const today = new Date().toISOString().slice(0, 10);

/* ---------- 1. Model, varian, harga ---------- */
const plHtml = await (await get(PRICE_LIST)).text();
const pl = jsonVar(plHtml, "data_price_list");
if (!pl) throw new Error("data_price_list tiada — struktur laman berubah; data.js tidak diubah.");
const pen = pl.states.find(s => s.id === "Peninsular Malaysia");
if (!pen) throw new Error("Tiada data Semenanjung");

const models = new Map(); // id -> {id, name, type, url, pages:Set, grades:Map}
for (const tab of pen.tabs) for (const it of tab.items || []) for (const c of it.categories || []) for (const g of c.gradeLists || []) {
  const gUrl = g.url || it.url || "";
  const seg = (gUrl.match(/\/en\/models\/([^/.]+)/) || [])[1];
  if (!seg || EXCLUDE_SEG.has(seg) || EXCLUDE_GRADE.test(g.header)) continue;
  const id = seg.replace(/-hybrid-electric$/, "");
  const ip = (g.priceTypes || []).find(t => t.type === "Individual Private");
  const price = rmNum(ip ? ip.price : g.price && g.price.retail);
  if (!price) continue;
  let name = g.header.trim().replace(/Hybrid Electric/i, "HEV").replace(/^CAMRY\b/, "Camry");
  const m = models.get(id) || { id, names: [], type: null, url: SITE + "/en/models/" + seg + ".html", pages: new Set(), grades: new Map() };
  m.names.push(String(it.header || "").replace(/\b(ALL-NEW|NEW)\b/g, "").replace(/HYBRID ELECTRIC|\bHEV\b|GR SPORT/g, "").replace(/\s+/g, " ").trim());
  const byDesc = TYPE_BY_DESC[String(it.desc || "").toLowerCase().trim()];
  if (!m.type && (byDesc || TYPE_BY_TAB[tab.id])) m.type = byDesc || TYPE_BY_TAB[tab.id];
  if (it.url) m.pages.add(it.url);
  if (it.img && !m.img && !/bev/i.test(it.url || "")) m.img = it.img;
  const key = name.toLowerCase();
  if (![...m.grades.keys()].some(k => k.toLowerCase() === key)) {
    const cls = (g.class || []).join(" ");
    const fuel = /\bBEV\b/i.test(name) || EV_SEG.has(seg) || /battery electric/i.test(cls) ? "EV" : /hybrid|hev/i.test(cls + " " + name) ? "HEV" : /diesel/i.test(cls) ? "Diesel" : "Petrol";
    m.grades.set(name, { name, fuel, price, url: g.url, pdf: ip && ip.pdfLink || "" });
  }
  models.set(id, m);
}
for (const m of models.values()) {
  m.name = NICE[m.id] || titleCase(m.names.filter(Boolean).sort((a, b) => a.length - b.length)[0] || m.id);
  if (!m.type) m.type = "SUV";
}
const gradeCount = [...models.values()].reduce((a, m) => a + m.grades.size, 0);
if (models.size < 8 || gradeCount < 15) throw new Error(`Terlalu sedikit model/varian (${models.size}/${gradeCount}); data.js tidak diubah.`);

/* ---------- 2. Rebate bulanan ---------- */
let rebateMonth = "", rebateSrc = PROMO; const tiles = [];
try {
  const html = await (await get(PROMO)).text();
  for (const m of html.matchAll(/window\.component_promotion_tiles__\d+\s*=\s*(\{[\s\S]*?\});\s*<\/script>/g)) { try { tiles.push(...(JSON.parse(m[1]).lists || [])); } catch { } }
  const mm = html.match(/\/promotions\/([a-z]+)-(\d{4})\//i);
  if (mm) rebateMonth = mm[1][0].toUpperCase() + mm[1].slice(1).toLowerCase() + " " + mm[2];
} catch (e) { console.warn("Rebate gagal dibaca:", e.message); }
const normT = s => String(s || "").toUpperCase().replace(/\b(ALL-NEW|NEW)\b/g, " ").replace(/HYBRID ELECTRIC/g, "HEV").replace(/\bGR-S\b/g, "GR SPORT").replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const rebateTiles = new Map();
for (const l of tiles) {
  let amount = rmNum(l.discountAmount);
  const cash = [...String(l.conditionsText || "").matchAll(/RM\s?([\d,]+)\s*(?:cash\s*)?rebate/gi)].map(x => +x[1].replace(/,/g, ""));
  if (cash.length) amount = Math.max(...cash);
  rebateTiles.set(normT(l.title), amount);
}
const promoKey = (m, g) => normT(m.name + (g.fuel === "HEV" ? " HEV" : "") + (g.fuel === "EV" && !EV_SEG.has(m.id) ? " BEV" : "") + (/GR Sport/i.test(g.name) ? " GR SPORT" : "") + (/single cab/i.test(g.name) ? " SINGLE CAB" : ""));
const usedTiles = new Set();
for (const m of models.values()) for (const g of m.grades.values()) {
  const k = promoKey(m, g);
  g.rebate = rebateTiles.get(k) || 0; if (rebateTiles.has(k)) usedTiles.add(k);
}
if (!tiles.length && prevData) { // promo gagal: kekalkan rebate lama
  for (const m of models.values()) for (const g of m.grades.values()) {
    const pg = prevData.models.flatMap(x => x.grades).find(x => x.name === g.name); g.rebate = pg ? pg.rebate || 0 : 0;
  }
  rebateMonth = prevData.rebateMonth || "";
}

/* ---------- 3. Harga warna dari PDF senarai harga ---------- */
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const normC = s => String(s || "").toLowerCase().replace(/\(2-?\s?tone\)|\b2-?\s?tone\b|with black roof/g, " 2tone ").replace(/\([^)]*\)/g, " ")
  .replace(/\bii\b/g, "2").replace(/\bgray\b/g, "grey").replace(/\bmc\b/g, " ").replace(/\b(mica|metallic|solid)\b/g, " ").replace(/[^a-z0-9 ]/g, " ")
  .split(/\s+/).filter(Boolean).sort().join(" ");
function parsePdfText(txt) {
  const lines = txt.split(/\r?\n/), rows = [];
  let on = false, cols = [];
  for (const ln of lines) {
    if (/Colou?rs?\s+Availability/i.test(ln) || /^\s*Colou?rs\s*$/i.test(ln)) {
      on = true;
      // Lajur varian dalam pengepala jadual (selepas "Code"), tanpa "Price" dan teks hubungan
      const after = ln.split(/\bCode\b/)[1];
      if (after) cols = after.split(/\s{2,}/).map(s => s.trim()).filter(s => s && !/^price$/i.test(s) && !/information|contact|toyota|website|freephone/i.test(s));
    }
    if (!on) continue;
    const r = ln.match(/^\s*\d+\)\s+(.+?)\s{2,}(?:v\s+)?([A-Z0-9]{3})\b(.*)$/);
    if (r) {
      const p = r[3].match(/RM\s?([\d,]+)/);
      const marks = [...r[3].matchAll(/\bAvailable\b|N\/A/g)].map(x => x[0] === "Available");
      // Ketersediaan ikut lajur hanya bila bilangan tanda = bilangan lajur; 1 tanda = semua varian; selain itu tidak pasti
      const avail = cols.length && marks.length === cols.length ? marks : marks.length === 1 && marks[0] ? cols.map(() => true) : null;
      rows.push({ name: r[1].trim(), code: r[2], price: p ? +p[1].replace(/,/g, "") : 0, avail });
    }
  }
  // Ayat "Additional Price of RM 1,500.00 for A and B, RM 1,800.00 for C."
  const flat = txt.replace(/\s+/g, " ");
  const add = flat.match(/Additional Price of (RM[\s\S]*?)(?:\bNote\b|\(a\)|$)/i);
  if (add) for (const seg of add[1].matchAll(/RM\s?([\d,]+)(?:\.\d+)?\s+for\s+(.+?)(?=,?\s*(?:and\s+)?RM\s?[\d,]|\.\s|$)/gi)) {
    const amt = +seg[1].replace(/,/g, "");
    for (const nm of seg[2].split(/,|\band\b/)) { const n = normC(nm); const row = rows.find(r => normC(r.name) === n); if (row) row.price = amt; }
  }
  return { cols, rows };
}
// Padankan varian dengan lajur PDF: token sama tolak separuh token lebihan lajur
const normG = s => String(s || "").toUpperCase().replace(/GR-S\b/g, "GR SPORT").replace(/A\/T/g, "AT").replace(/M\/T/g, "MT").replace(/4X4/g, "4WD")
  .replace(/D\/CAB/g, "DOUBLE CAB").replace(/S\/CAB/g, "SINGLE CAB").replace(/HYBRID ELECTRIC/g, "HEV").replace(/[^A-Z0-9. ]/g, " ").split(/\s+/).filter(Boolean);
function columnOf(pdf, gradeName) {
  if (!pdf || !pdf.cols || !pdf.cols.length) return -1;
  const g = new Set(normG(gradeName)); let best = -1, bestS = 0;
  pdf.cols.forEach((c, i) => { const t = normG(c); const ov = t.filter(x => g.has(x)).length; const s = ov - 0.5 * (t.length - ov); if (s > bestS) { bestS = s; best = i; } });
  return best;
}
const pdfRow = (pdf, name, code) => pdf && pdf.rows ? (code && pdf.rows.find(r => r.code === code)) || pdf.rows.find(r => normC(r.name) === normC(name)) : null;
let hasPdftotext = true; try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); } catch { hasPdftotext = false; }
const pdfLinks = new Set([...models.values()].flatMap(m => [...m.grades.values()].map(g => g.pdf)).filter(Boolean));
// Ujian tempatan tanpa pdftotext: PDF_TXT_DIR = folder dengan index.txt ("pN <link>") + pN.txt
const txtDir = process.env.PDF_TXT_DIR, txtIndex = {};
if (txtDir) for (const l of readFileSync(path.join(txtDir, "index.txt"), "utf8").split(/\r?\n/)) { const [k, v] = l.split(" "); if (v) txtIndex[v] = path.join(txtDir, k + ".txt"); }
for (const link of pdfLinks) {
  if (cache[link]) continue;
  if (txtIndex[link]) { cache[link] = parsePdfText(readFileSync(txtIndex[link], "utf8")); continue; }
  if (!hasPdftotext) { console.warn("pdftotext tiada; PDF baru dilangkau:", link); continue; }
  try {
    const buf = Buffer.from(await (await get(SITE + link)).arrayBuffer());
    const f = path.join(tmpdir(), "pl-" + Date.now() + ".pdf"); writeFileSync(f, buf);
    const txt = execFileSync("pdftotext", ["-layout", f, "-"], { encoding: "utf8" }); unlinkSync(f);
    cache[link] = parsePdfText(txt);
    console.log("PDF dibaca:", link, cache[link].rows.length, "warna, lajur:", cache[link].cols.join(" | "));
  } catch (e) { console.warn("PDF gagal:", link, e.message); }
}
for (const k of Object.keys(cache)) if (!pdfLinks.has(k)) delete cache[k];

/* ---------- 4. Warna + gambar ikut varian ---------- */
const pageCache = new Map();
async function coloursOf(url) {
  if (!url) return null;
  if (pageCache.has(url)) return pageCache.get(url);
  let d = null; try { d = jsonVar(await (await get(url)).text(), "data_colors"); } catch { }
  pageCache.set(url, d); return d;
}
const cleanName = s => String(s || "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+(\d[A-Z0-9]{2}|MC)$/i, "").replace(/\s+/g, " ").trim();
const codeIn = s => (String(s || "").match(/\(([A-Z0-9]{3})\)/) || String(s || "").match(/\s(\d[A-Z0-9]{2})$/) || [])[1] || "";
const HEX = [[/white/i, "#f2f2ee"], [/silver/i, "#9da2a4"], [/grey|gray|cement|metal stream|celestite|ash/i, "#6a7376"], [/black/i, "#0b0d10"], [/red|scarlet|crimson|ruby/i, "#a4120f"], [/blue/i, "#203079"], [/brown|bronze/i, "#4a302e"], [/turquoise|green/i, "#0f6b73"], [/gold/i, "#b9965a"]];
const hexFor = n => (HEX.find(([re]) => re.test(n)) || [, "#cccccc"])[1];
mkdirSync(COLDIR, { recursive: true });
const keepImg = new Set(); let newImg = 0;
function toWebp(buf, out) {
  const tmp = path.join(tmpdir(), "c-" + Date.now() + ".png"); writeFileSync(tmp, buf);
  try { execFileSync("cwebp", ["-quiet", "-resize", "900", "0", "-q", "80", tmp, "-o", out]); }
  catch { execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", "scale=900:-1", "-c:v", "libwebp", "-quality", "80", out]); }
  unlinkSync(tmp);
}
async function image(src) {
  if (!src) return "";
  const url = src.startsWith("http") ? src : SITE + src;
  const file = createHash("sha1").update(url).digest("hex").slice(0, 10) + ".webp", out = path.join(COLDIR, file);
  if (!existsSync(out)) {
    try {
      const r = await fetch(url, UA); const buf = Buffer.from(await r.arrayBuffer());
      if (!r.ok || buf.length < 2000) throw new Error("gambar tidak sah");
      toWebp(buf, out); newImg++;
    } catch { return ""; }
  }
  keepImg.add(file); return "img/col/" + file;
}
const prevCols = g => (prevData && prevData.models.flatMap(x => x.grades).find(x => x.name === g.name) || {}).cols || [];
for (const m of models.values()) for (const g of m.grades.values()) {
  let list = null;
  // Halaman paling hampir dengan varian dahulu: GR Sport -> laman gr-sport; HEV -> laman hybrid; petrol/diesel -> laman model asas
  const isGR = /GR Sport/i.test(g.name), isHEV = g.fuel === "HEV";
  const fit = u => { const gr = /gr-sport/i.test(u), hy = /hybrid-electric(?!\/corolla-cross-1)|hev/i.test(u.replace(/^.*\/models\/[^/]+-hybrid-electric(\.html|\/)/, "/x$1"));
    const bev = /\bbev\b|-bev/i.test(u), isEV = g.fuel === "EV";
    if (bev !== isEV) return -9; // halaman BEV hanya untuk varian EV, dan sebaliknya
    return (isGR ? (gr ? 3 : 0) : gr ? -5 : isHEV ? (hy ? 2 : 1) : (hy ? 0 : 2)) + (u === m.url ? 0.5 : 0); };
  const pages = [...new Set([...m.pages, m.url])].sort((a, b) => fit(b) - fit(a));
  for (const u of [g.url, ...pages]) {
    const d = await coloursOf(u); if (!d || !d.options) continue;
    const ext = d.options.find(o => o.id === "exterior") || d.options[0]; if (!ext || !(ext.colors || []).length) continue;
    list = [];
    for (const c of ext.colors) list.push({ raw: c.colorName, hex: c.colorCode && c.colorCode.backgroundColor, add: c.additionalPrice, src: c.folderUrl ? c.folderUrl + "/01.png" : c.imgUrl });
    for (const v of ext.variantColors || []) {
      if ((v.exclusiveTo || []).length && !v.exclusiveTo.some(x => x.toLowerCase() === g.name.toLowerCase())) continue;
      if (!list.some(x => cleanName(x.raw) === cleanName(v.colorName))) list.push({ raw: v.colorName, hex: v.colorCode && v.colorCode.backgroundColor, add: v.additionalPrice, src: v.imgUrl });
    }
    break;
  }
  const pdf = cache[g.pdf];
  // Laman tiada data warna (cth. GR Yaris): guna senarai warna dalam jadual PDF (tanpa gambar)
  if (!list && pdf && pdf.rows && pdf.rows.length) list = pdf.rows.map(r => ({ raw: r.name + " (" + r.code + ")", hex: null, add: "", src: "" }));
  if (!list) { g.cols = prevCols(g); continue; } // gagal: kekalkan warna lama
  g.cols = [];
  const ci = columnOf(pdf, g.name);
  for (const c of list) {
    const n = cleanName(c.raw), code = codeIn(c.raw);
    const row = pdfRow(pdf, n, code);
    if (row && ci >= 0 && row.avail && row.avail[ci] === false) continue; // PDF: warna tiada untuk varian ini
    let p = row ? row.price : null;
    if (p == null) { const old = prevCols(g).find(x => x.n === n); p = old ? old.p : rmNum(c.add); }
    if (!p && rmNum(c.add)) p = rmNum(c.add);
    // Toyota kadang guna gambar model LAIN (cth. laman Hiace SLWB guna gambar Hiace panel van): abaikan gambar itu
    const folder = (String(c.src || "").match(/\/models\/([^/]+)\//) || [])[1];
    const wrongModel = folder && folder !== m.id && models.has(folder);
    g.cols.push({ n, hex: c.hex || hexFor(n), p, img: wrongModel ? "" : await image(c.src) });
  }
}


/* ---------- 4b. Gambar warna yang Toyota Malaysia tiada: ambil dari Toyota Thailand (gambar rasmi Toyota) ---------- */
const TH = "https://www.toyota.co.th";
const thPages = new Map();
async function thColours(id) { // nama warna -> laluan gambar di laman model Toyota Thailand
  const slug = id.replace(/-/g, "");
  if (thPages.has(slug)) return thPages.get(slug);
  const map = {};
  try {
    const html = await (await get(TH + "/en/model/" + slug)).text();
    for (const m of html.matchAll(/"([^"]{3,40})","#[0-9a-fA-F]{6}","(product\/series\/colors\/v\/[^"]+\.webp)"/g)) map[normC(m[1])] = m[2];
  } catch { }
  thPages.set(slug, map); return map;
}
// Potong ruang lutsinar di sekeliling kereta supaya saiz sepadan dengan gambar lain
function trimToWebp(buf, out) {
  const tmp = path.join(tmpdir(), "th-" + Date.now() + ".webp"); writeFileSync(tmp, buf);
  let crop = "";
  try { const r = require_ffmpeg_crop(tmp); if (r) crop = r + ","; } catch { }
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", crop + "scale=900:-1", "-c:v", "libwebp", "-quality", "80", out]);
  unlinkSync(tmp);
}
function require_ffmpeg_crop(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-vf", "alphaextract,cropdetect=limit=0.05:round=2:reset=0:skip=0", "-f", "null", "-"], { encoding: "utf8" });
  const all = [...String(r.stderr || "").matchAll(/crop=(\d+:\d+:\d+:\d+)/g)];
  return all.length ? "crop=" + all[all.length - 1][1] : "";
}
const family = n => { const s = String(n).toLowerCase(); return /white/.test(s) ? "white" : /black/.test(s) ? "black" : /red|scarlet|crimson/.test(s) ? "red" : /blue/.test(s) ? "blue" : /grey|gray|silver|metal/.test(s) ? "grey" : ""; };
let thImg = 0;
for (const m of models.values()) {
  const need = [...m.grades.values()].some(g => (g.cols || []).some(c => !c.img));
  if (!need) continue;
  const th = await thColours(m.id);
  for (const g of m.grades.values()) for (const c of g.cols || []) {
    if (c.img) continue;
    // Padanan tepat ikut nama; jika tiada, guna warna sekeluarga (putih/hitam/merah/biru/kelabu) sebagai ilustrasi
    let p = th[normC(c.n)], illus = false;
    if (!p) { const f = family(c.n); const k = f && Object.keys(th).find(k => family(k) === f); if (k) { p = th[k]; illus = true; } }
    if (!p) continue;
    const url = TH + "/media/" + p;
    const file = "th-" + createHash("sha1").update(url).digest("hex").slice(0, 10) + ".webp", out = path.join(COLDIR, file);
    if (!existsSync(out)) {
      try { const r = await fetch(url, UA); const buf = Buffer.from(await r.arrayBuffer()); if (!r.ok || buf.length < 2000) throw 0; trimToWebp(buf, out); thImg++; }
      catch { continue; }
    }
    keepImg.add(file); c.img = "img/col/" + file; c.src = "th"; if (illus) c.illus = true;
  }
}
if (thImg) console.log("Gambar warna dari Toyota Thailand:", thImg);

/* ---------- 4c. Gambar model (potongan lutsinar) dari "explore thumbnail" laman model Toyota Malaysia ---------- */
async function exploreCut(m, out) {
  try {
    const seg = (m.url.match(/\/models\/([^/.]+)/) || [])[1] || m.id;
    const html = await (await get(m.url)).text();
    const all = [...new Set(html.match(/\/content\/dam\/malaysia\/models\/[^"' )]*explore-thumbnail[^"' )]*\.png/gi) || [])];
    const words = m.id.split("-").filter(w => w.length > 1);
    // Pilih gambar yang namanya padan dengan model ini (cth. "hiace-slwb"), bukan model lain
    const pick = all.find(u => u.toLowerCase().includes(m.id)) || all.find(u => u.toLowerCase().includes(seg)) ||
      all.find(u => words.every(w => u.toLowerCase().includes(w)));
    if (!pick) return;
    const r = await fetch(SITE + pick, UA); const buf = Buffer.from(await r.arrayBuffer());
    if (!r.ok || buf.length < 2000) return;
    const tmp = path.join(tmpdir(), "x-" + Date.now() + ".png"); writeFileSync(tmp, buf);
    // Potong ruang lutsinar supaya semua kereta duduk sebaris (jalur model bergerak & pentas)
    const crop = require_ffmpeg_crop(tmp);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, ...(crop ? ["-vf", crop] : []), "-c:v", "libwebp", "-quality", "88", out]);
    unlinkSync(tmp);
    console.log("Gambar model (explore thumbnail):", m.id, "<-", pick);
  } catch (e) { console.warn("explore thumbnail gagal:", m.id, e.message); }
}

/* ---------- 5. Tulis data.js ---------- */
const out = {
  source: PRICE_LIST, rebateSource: rebateSrc, rebateMonth,
  models: await Promise.all([...models.values()].sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99)).map(async m => {
    const cutFile = path.join(ROOT, "img", "cut", m.id + ".webp");
    if (!existsSync(cutFile)) await exploreCut(m, cutFile); // gambar potongan rasmi Toyota (explore thumbnail) jika ada
    const grades = [...m.grades.values()].sort((a, b) => a.price - b.price).map(g => ({ name: g.name, fuel: g.fuel, price: g.price, rebate: g.rebate || 0, cols: g.cols || [] }));
    const firstImg = (grades.flatMap(g => g.cols).find(c => c.img) || {}).img || (await image(m.img)) || "";
    return { id: m.id, name: m.name, type: m.type, url: m.url, cut: existsSync(cutFile) ? "img/cut/" + m.id + ".webp" : firstImg, grades };
  }))
};
for (const f of readdirSync(COLDIR)) if (f.endsWith(".webp") && !keepImg.has(f)) unlinkSync(path.join(COLDIR, f));
const same = prevData && JSON.stringify({ ...prevData, updatedAt: 0, checkedAt: 0 }) === JSON.stringify({ ...out, updatedAt: 0, checkedAt: 0 });
out.updatedAt = same ? prevData.updatedAt : today;
out.checkedAt = today;
const ordered = { updatedAt: out.updatedAt, checkedAt: out.checkedAt, source: out.source, rebateSource: out.rebateSource, rebateMonth: out.rebateMonth, models: out.models };
mkdirSync(path.dirname(CACHE), { recursive: true });
writeFileSync(CACHE, JSON.stringify(cache, null, 1) + "\n");
writeFileSync(DATA, "// Dijana oleh scripts/update.mjs — jangan sunting tangan\nwindow.TOYOTA = " + JSON.stringify(ordered) + ";\n");

// Teks statik yang Google baca: bilangan model dalam tajuk, dan tarikh lastmod sitemap (ikut tarikh data berubah)
const editFile = (rel, fn) => { const f = path.join(ROOT, rel); if (!existsSync(f)) return; const a = readFileSync(f, "utf8"), b = fn(a); if (a !== b) writeFileSync(f, b); };
const nModels = out.models.length;
editFile("index.html", s => s.replace(/(<b id="modelCount">)\d+ MODEL,(<\/b>)/, `$1${nModels} MODEL,$2`));
editFile("en/index.html", s => s.replace(/(<b id="modelCount">)\d+ MODELS?,(<\/b>)/, `$1${nModels} MODELS,$2`));
editFile("sitemap.xml", s => s.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${ordered.updatedAt}</lastmod>`));

const paid = out.models.flatMap(m => m.grades.flatMap(g => g.cols.filter(c => c.p).map(c => `${g.name}: ${c.n} +RM${c.p}`)));
const unusedTiles = [...rebateTiles.keys()].filter(k => !usedTiles.has(k));
console.log(`${same ? "Tiada perubahan" : "DIKEMAS KINI"} · ${out.models.length} model · ${gradeCount} varian · rebate ${rebateMonth || "-"} · gambar baru ${newImg}`);
console.log("Warna berbayar:", paid.join("; ") || "-");
console.log("Promo tanpa padanan:", unusedTiles.join(", ") || "-");
console.log("Varian tanpa warna:", out.models.flatMap(m => m.grades.filter(g => !g.cols.length).map(g => g.name)).join(", ") || "-");
