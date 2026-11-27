#!/usr/bin/env python3
"""Jadual service Maxcheck: baca laman Maxcheck Toyota Malaysia, tukar setiap muka surat PDF rasmi
kepada gambar (supaya pelawat nampak terus tanpa download), dan tulis maxcheck/data.js.
Dijalankan GitHub Actions setiap 7 hari (maxcheck.yml). Perlu: pip install pymupdf pillow
Jika laman/PDF gagal dibaca, skrip keluar dengan ralat dan data lama dikekalkan."""
import hashlib, io, json, re, sys, urllib.request, datetime
from pathlib import Path
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "maxcheck"
IMG = OUT / "img"
DATA = OUT / "data.js"
SITE = "https://www.toyota.com.my"
PAGE = SITE + "/en/servicing-and-support/maxcheck.html"
UA = {"User-Agent": "Mozilla/5.0 (wanjasni toyota site updater)"}
RENDER_V = 6  # naikkan jika tetapan gambar berubah (jana semula semua)
DPI, WEBP_QUALITY = 240, 72  # ±2800 px lebar: cukup tajam untuk kongsi WhatsApp; semua gambar kekal bawah 40 MB
MIN_MODELS = 25


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return r.read()


def read_models(html):
    """Setiap kad kategori: "header": "SEDAN", ... "desc": "<ul><li><a href=...pdf>Vios</a>..." """
    groups, seen = [], set()
    pat = re.compile(r'"header":\s*"((?:[^"\\]|\\.)*)",\s*"topHeader":\s*"(?:[^"\\]|\\.)*",\s*"desc":\s*"((?:[^"\\]|\\.)*)"')
    for m in pat.finditer(html):
        header = json.loads('"%s"' % m.group(1)).strip()
        desc = json.loads('"%s"' % m.group(2))
        links = re.findall(r'<a [^>]*href="(/content/dam/[^"]*periodic-maintenance/[^"]+\.pdf)"[^>]*>(.*?)</a>', desc, re.S)
        models = []
        for href, label in links:
            if href in seen:
                continue
            seen.add(href)
            name = re.sub(r"<[^>]+>|&nbsp;", " ", label)
            name = " ".join(name.replace("&amp;", "&").split())
            slug = re.sub(r"-(january|february|march|april|may|june|july|august|september|october|november|december)-\d{4}.*$", "",
                          href.rsplit("/", 1)[-1][:-4])
            models.append({"id": slug, "name": name, "pdf": href})
        if models:
            groups.append({"name": header, "models": models})
    return groups


def page_label(page):
    """Tajuk varian di penjuru kiri atas (cth. 'VIOS 1.5G / 1.5E (Auto)' + 'Model Code: NGC102'),
    dibaca ikut baris teks & saiz huruf (susunan blok dalam PDF Toyota tidak sentiasa sama)."""
    r = page.rect
    lines = []
    for blk in page.get_text("dict")["blocks"]:
        for ln in blk.get("lines", []):
            x0, y0 = ln["bbox"][0], ln["bbox"][1]
            if x0 > r.width * 0.36 or y0 < 70 or y0 > r.height * 0.34:
                continue
            txt = " ".join("".join(sp["text"] for sp in ln["spans"]).split())
            if txt:
                lines.append((round(y0), x0, max(sp["size"] for sp in ln["spans"]), txt))
    lines.sort()
    # nota kecil di bawah tajuk, cth. "Note: ** This package price applicable for Hilux models launched after September 2020"
    full = " ".join(page.get_text().split())
    nm = re.search(r"applicable (?:for|to) (.{5,90}?(?:19|20)\d{2}(?: onwards| and (?:above|below)| and before)?)", full, re.I)
    note = nm.group(1).strip(" .*") if nm else ""
    code, title = "", []
    for _, _, size, txt in lines:
        m = re.search(r"Model\s*Code\s*:\s*([A-Z0-9][A-Z0-9, /#\-]*)", txt)
        if m:
            code = m.group(1).strip(" ,/-")
            continue
        low = txt.lower()
        if size >= 11.5 and not any(k in low for k in ("toyota.com", "move your", "synthetic", "lubricant", "unit price", "maxcheck", "note")):
            title.append(txt)
    name = re.sub(r"^TOYOTA\s+", "", " ".join(title[:3]), flags=re.I).strip(" |-")
    if len(name) > 90:
        name = ""
    d = re.search(r"Effective Date\s*:\s*(\d{1,2})\s*(?:st|nd|rd|th)?\s*([A-Za-z]+)\s*(\d{4})", " ".join(page.get_text().split()))
    effective = "%s %s %s" % d.groups() if d else ""
    return name, code, effective, note


# Generasi ikut kod model (susunan: paling baru dahulu). Papar generasi semasa + PREV_GENS sebelumnya (arahan Wan).
# Kod yang tidak dikenali = generasi baru (sentiasa dipapar & dikira); muka surat tanpa kod sentiasa dipapar.
PREV_GENS = 3
GENS = {
    "vios": [r"NGC1|NYC1", r"NCP15|NSP15", r"NCP9", r"NCP4"],
    "corolla-altis": [r"ZRE21|MZEA", r"ZRE17", r"ZRE14|ZZE14", r"ZZE12"],
    "camry": [r"AXVA8|AXVH8", r"AXVA7|AXVH7|ASV7", r"ASV5|ACV5|AVV5", r"ACV4", r"ACV3", r"SXV2"],
    "camry-hev": [r"AXVA8|AXVH8", r"AXVA7|AXVH7|ASV7", r"ASV5|ACV5|AVV5", r"ACV4", r"ACV3", r"SXV2"],
    "fortuner": [r"TGN1[56]|GUN1[56]", r"TGN5|KUN[56]"],
    "hilux": [r"GUN1|GUN2|XPN", r"KUN[12]|GGN|TGN1", r"KDN1|LN1|RZN"],
    "innova": [r"MAG[AH]", r"TGN14", r"TGN4"],
    "avanza": [r"F65|F8", r"F60"],
    "hiace": [r"GDH3|GRH3", r"KDH|TRH", r"LH1"],
    "alphard": [r"AAHH|TAHA", r"AGH3|GGH3", r"ANH2|GGH2", r"ANH1|MNH1"],
}


def limit_generations(mid, pages):
    rules = GENS.get(mid)
    if not rules:
        return pages
    def gen(p):
        if not p["code"]:
            return None
        for i, rx in enumerate(rules):
            if re.search(r"(?<![A-Z0-9])(?:%s)" % rx, p["code"]):
                return i
        return -1  # kod baru
    gens = [gen(p) for p in pages]
    present = sorted({g for g in gens if g is not None})  # -1 (baru) di hadapan
    keep = set(present[: PREV_GENS + 1])
    return [p for p, g in zip(pages, gens) if g is None or g in keep]


def grab(page, dpi):
    pix = page.get_pixmap(dpi=dpi, alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    # buang ruang putih bawah/atas yang kosong
    gray = img.convert("L").point(lambda v: 255 if v > 248 else 0)
    box = Image.eval(gray, lambda v: 255 - v).getbbox()
    if box:
        pad = round(18 * dpi / 170)
        img = img.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad)))
    return img


def render(page):
    img = grab(page, DPI)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    return buf.getvalue(), img.width, img.height


def load_previous():
    try:
        return json.loads(DATA.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
    except Exception:
        return {}


def main():
    groups = read_models(fetch(PAGE).decode("utf-8", "replace"))
    count = sum(len(g["models"]) for g in groups)
    if count < MIN_MODELS:
        sys.exit("Hanya %d model dijumpai di laman Maxcheck (struktur berubah?); data lama dikekalkan." % count)
    prev = load_previous()
    old = {m["pdf"]: m for g in prev.get("groups", []) for m in g["models"]} if prev.get("renderV") == RENDER_V else {}
    IMG.mkdir(parents=True, exist_ok=True)
    changed, failed = [], []
    for g in groups:
        for m in g["models"]:
            before = old.get(m["pdf"])
            try:
                blob = fetch(SITE + m["pdf"])
                if blob[:4] != b"%PDF":
                    raise ValueError("bukan PDF")
                sha = hashlib.sha256(blob).hexdigest()[:12]
                if before and before.get("sha") == sha and all((OUT / p["img"]).exists() for p in before["pages"]):
                    m.update(sha=sha, effective=before.get("effective", ""), pages=before["pages"])
                    continue
                doc = pymupdf.open(stream=blob, filetype="pdf")
                pages, effective = [], ""
                for i, page in enumerate(doc):
                    name, code, eff, note = page_label(page)
                    effective = effective or eff
                    data, w, h = render(page)
                    rel = "img/%s-%d-%s.webp" % (m["id"], i + 1, sha[:6])
                    (OUT / rel).write_bytes(data)
                    pages.append({"label": name or "%s (%d)" % (m["name"], i + 1), "code": code, "note": note, "img": rel, "w": w, "h": h})
                if not pages:
                    raise ValueError("PDF kosong")
                shown = limit_generations(m["id"], pages)
                for p in pages:
                    if p not in shown:
                        (OUT / p["img"]).unlink(missing_ok=True)
                if len(shown) < len(pages):
                    print("Had generasi %s: %d -> %d muka surat" % (m["name"], len(pages), len(shown)))
                pages = shown
                m.update(sha=sha, effective=effective, pages=pages)
                changed.append(m["name"])
            except Exception as e:  # kekalkan versi lama untuk model ini jika ada
                old_by_id = {x["id"]: x for gg in prev.get("groups", []) for x in gg["models"]}
                keep = before or old_by_id.get(m["id"])
                if keep:
                    m.update(sha=keep.get("sha", ""), effective=keep.get("effective", ""), pages=keep["pages"], pdf=keep["pdf"])
                failed.append("%s (%s)" % (m["name"], e))
        g["models"] = [m for m in g["models"] if m.get("pages")]
    groups = [g for g in groups if g["models"]]
    total = sum(len(g["models"]) for g in groups)
    if total < MIN_MODELS:
        sys.exit("Terlalu banyak PDF gagal (%d berjaya); data lama dikekalkan." % total)
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).date().isoformat()
    out = {"renderV": RENDER_V, "checkedAt": now, "source": PAGE, "groups": groups}
    DATA.write_text("// Dijana oleh scripts/maxcheck.py — jangan sunting tangan\nwindow.MAXCHECK = " +
                    json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    used = {p[k].split("/", 1)[1] for g in groups for m in g["models"] for p in m["pages"] for k in ("img",)}
    for f in list(IMG.glob("*.webp")) + list(IMG.glob("*.jpg")):
        if f.name not in used:
            f.unlink()
    npages = sum(len(m["pages"]) for g in groups for m in g["models"])
    print("Maxcheck: %d model, %d muka surat, dikemas kini: %s" % (total, npages, ", ".join(changed) or "tiada"))
    if failed:
        print("::warning::Gagal (versi lama dikekalkan jika ada): " + "; ".join(failed))
    for g in groups:
        print(" ", g["name"], "->", ", ".join("%s[%d]%s" % (m["name"], len(m["pages"]), "" if m["effective"] else " (tiada tarikh)") for m in g["models"]))


if __name__ == "__main__":
    main()
