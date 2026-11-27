#!/usr/bin/env python3
"""Senarai harga rasmi: baca laman price-list Toyota Malaysia (Semenanjung sahaja), tukar setiap PDF
kepada gambar (pelawat nampak terus tanpa download), dan tulis pricelist/data.js.
Satu butang setiap model: petrol, HEV & GR Sport model yang sama berkongsi senarai harga (cth. Vios).
Hanya model BEV yang ada senarai harga sendiri diasingkan (Hilux BEV).
Dijalankan GitHub Actions setiap minggu (pricelist.yml). Perlu: pip install pymupdf pillow
Jika laman/PDF gagal dibaca, skrip keluar dengan ralat atau mengekalkan versi lama."""
import datetime, hashlib, io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pricelist"
IMG = OUT / "img"
DATA = OUT / "data.js"
SITE = "https://www.toyota.com.my"
PAGE = SITE + "/en/price-and-model-tools/price-list.html"
UA = {"User-Agent": "Mozilla/5.0 (wanjasni toyota site updater)"}
RENDER_V = 4  # naikkan jika tetapan gambar berubah (jana semula semua)
DPI, WEBP_QUALITY = 240, 72  # ±2800 px lebar: cukup tajam untuk kongsi WhatsApp; semua gambar kekal bawah 40 MB
MIN_MODELS = 18

NAMES = {"gr86": "GR86", "gr-corolla": "GR Corolla", "gr-yaris": "GR Yaris", "bz4x": "bZ4X", "urban-cruiser": "Urban Cruiser",
         "alphard": "Alphard", "vellfire": "Vellfire", "vios": "Vios", "yaris": "Yaris", "yaris-cross": "Yaris Cross",
         "corolla": "Corolla", "corolla-cross": "Corolla Cross", "camry": "Camry", "veloz": "Veloz", "zenix": "Innova Zenix",
         "fortuner": "Fortuner", "hilux": "Hilux", "hiace": "Hiace", "hiace-slwb": "Hiace SLWB", "harrier": "Harrier"}
# susunan butang & kumpulan jenis badan
BODY = {"SEDAN": ["vios", "corolla", "camry"], "SUV": ["yaris-cross", "corolla-cross", "fortuner", "harrier", "bz4x", "urban-cruiser"],
        "MPV": ["veloz", "zenix", "alphard", "vellfire"], "PICKUP & VAN": ["hilux", "hiace", "hiace-slwb"],
        "HATCHBACK": ["yaris"], "GR LINEUP": ["gr86", "gr-yaris", "gr-corolla"]}
ORDER = ["vios", "yaris", "yaris-cross", "corolla", "corolla-cross", "camry", "veloz", "zenix", "fortuner", "hilux",
         "hiace", "hiace-slwb", "harrier", "bz4x", "urban-cruiser", "alphard", "vellfire", "gr86", "gr-yaris", "gr-corolla"]
EV_SEG = {"bz4x", "urban-cruiser"}
TYPES = {"Individual Private": "ip", "Company Private": "cp", "Company Commercial": "cc"}
TYPE_ORDER = ["ip", "cp", "cc"]


def fetch(url):
    url = urllib.parse.quote(url, safe=":/()%?=&,.-_~")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return r.read()


def is_bev(name, classes):
    return bool(re.search(r"\bbev\b|battery electric", (name + " " + " ".join(classes or [])).lower()))


def read_models(html):
    """window.data_price_list -> {(id, "bev" atau ""): {variants:[], pdfs:{pdfLink:set(jenis pembeli)}}} untuk Semenanjung."""
    m = re.search(r"window\.data_price_list\s*=\s*(?=\{)", html)
    if not m:
        sys.exit("data_price_list tiada (struktur laman berubah?); data lama dikekalkan.")
    pl, _ = json.JSONDecoder().raw_decode(html, m.end())
    pen = next((s for s in pl["states"] if s["id"] == "Peninsular Malaysia"), None)
    if not pen:
        sys.exit("Tiada data Semenanjung; data lama dikekalkan.")
    models = {}
    for tab in pen["tabs"]:
        for item in tab.get("items") or []:
            for cat in item.get("categories") or []:
                for g in cat.get("gradeLists") or []:
                    url = g.get("url") or item.get("url") or ""
                    s = re.search(r"/en/models/([^/.]+)", url)
                    if not s:
                        continue
                    seg = s.group(1)
                    mid = re.sub(r"-hybrid-electric$", "", seg)
                    name = " ".join(g["header"].split())
                    name = re.sub(r"Hybrid Electric", "HEV", name, flags=re.I)
                    name = re.sub(r"^CAMRY\b", "Camry", name)
                    own_bev = mid not in EV_SEG and is_bev(name, g.get("class"))  # cth. Hilux BEV: senarai harga lain
                    pdfs = [(TYPES.get(p.get("type"), "ip"), p.get("pdfLink")) for p in g.get("priceTypes") or []]
                    pdfs = [(t, link) for t, link in pdfs if link and link.lower().endswith(".pdf")]
                    if not pdfs:
                        continue
                    e = models.setdefault((mid, "bev" if own_bev else ""), {"variants": [], "pdfs": {}, "tab": tab["id"]})
                    if name.lower() not in [v.lower() for v in e["variants"]]:
                        e["variants"].append(name)
                    for t, link in pdfs:
                        e["pdfs"].setdefault(link, set()).add(t)
    return models


def model_name(mid, kind):
    base = NAMES.get(mid) or " ".join(w.capitalize() for w in mid.split("-"))
    return base + " BEV" if kind == "bev" else base


def body_of(mid, tab):
    for body, ids in BODY.items():
        if mid in ids:
            return body
    return {"sedan": "SEDAN", "suv": "SUV", "mpv": "MPV", "hatchback": "HATCHBACK", "pick-up-and-van": "PICKUP & VAN", "gr": "GR LINEUP"}.get(tab, "OTHERS")


def grab(page, dpi):
    # buang kotak kosong "For more information, please contact" bila ia memenuhi bahagian bawah muka surat
    r = page.rect
    clip = pymupdf.Rect(r)
    for hit in page.search_for("For more information"):
        if hit.x0 < r.width * 0.3 and hit.y0 > r.height * 0.45:
            # potong tepat di bibir atas kotak itu (baris nota di atasnya mesti kekal); tiada kotak = tak potong
            tops = [d["rect"].y0 for d in page.get_drawings()
                    if hit.y0 - 30 < d["rect"].y0 <= hit.y0 and d["rect"].y1 > hit.y1 + 60 and d["rect"].width > r.width * 0.5]
            if tops:
                clip.y1 = min(tops) - 1.5
    pix = page.get_pixmap(dpi=dpi, alpha=False, clip=clip)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
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


def effective_of(text):
    d = re.search(r"Effective\s*(?:from|date)?\s*:?\s*(\d{1,2})\s*(?:st|nd|rd|th)?\s*([A-Za-z]{3,})\s*(\d{4})", " ".join(text.split()), re.I)
    return "%s %s %s" % (d.group(1), d.group(2).capitalize(), d.group(3)) if d else ""


def load_previous():
    try:
        return json.loads(DATA.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
    except Exception:
        return {}


def main():
    found = read_models(fetch(PAGE).decode("utf-8", "replace"))
    if len(found) < MIN_MODELS:
        sys.exit("Hanya %d model dijumpai di laman price-list (struktur berubah?); data lama dikekalkan." % len(found))
    prev = load_previous()
    cache = prev.get("pdfs", {}) if prev.get("renderV") == RENDER_V else {}
    IMG.mkdir(parents=True, exist_ok=True)
    docs, changed, failed = {}, [], []
    for link in sorted({link for e in found.values() for link in e["pdfs"]}):
        before = cache.get(link)
        try:
            blob = fetch(SITE + link)
            if blob[:4] != b"%PDF":
                raise ValueError("bukan PDF")
            sha = hashlib.sha256(blob).hexdigest()[:12]
            if before and before["sha"] == sha and all((OUT / p["img"]).exists() for p in before["pages"]):
                docs[link] = before
                continue
            doc = pymupdf.open(stream=blob, filetype="pdf")
            pages, effective = [], ""
            slug = re.sub(r"[^a-z0-9]+", "-", link.rsplit("/", 1)[-1][:-4].lower()).strip("-")
            for i, page in enumerate(doc):
                effective = effective or effective_of(page.get_text())
                data, w, h = render(page)
                rel = "img/%s-%d-%s.webp" % (slug, i + 1, sha[:6])
                (OUT / rel).write_bytes(data)
                pages.append({"img": rel, "w": w, "h": h})
            if not pages:
                raise ValueError("PDF kosong")
            docs[link] = {"sha": sha, "effective": effective, "pages": pages}
            changed.append(link.rsplit("/", 1)[-1])
        except Exception as e:  # kekalkan versi lama jika ada
            if before:
                docs[link] = before
            failed.append("%s (%s)" % (link.rsplit("/", 1)[-1], e))
    old_models = {m["id"]: m for g in prev.get("groups", []) for m in g["models"]}
    entries = []
    for (mid, kind), e in found.items():
        eid = mid + ("-bev" if kind else "")
        links = [link for link in e["pdfs"] if link in docs]
        links.sort(key=lambda link: (min(TYPE_ORDER.index(t) for t in e["pdfs"][link]), link))
        pages, effective = [], ""
        for link in links:
            d = docs[link]
            effective = effective or d["effective"]
            for i, p in enumerate(d["pages"]):
                pages.append(dict(p, types=sorted(e["pdfs"][link], key=TYPE_ORDER.index), no=i + 1 if len(d["pages"]) > 1 else 0, effective=d["effective"]))
        if len(links) < len(e["pdfs"]) or not pages:  # ada PDF baru yang gagal: guna entri lama sepenuhnya
            if eid in old_models:
                entries.append((mid, e["tab"], old_models[eid]))
                continue
            if not pages:
                continue
        entries.append((mid, e["tab"], {"id": eid, "name": model_name(mid, kind), "variants": e["variants"], "effective": effective, "pages": pages}))
    if len(entries) < MIN_MODELS:
        sys.exit("Terlalu banyak PDF gagal (%d model berjaya); data lama dikekalkan." % len(entries))
    entries.sort(key=lambda x: (ORDER.index(x[0]) if x[0] in ORDER else len(ORDER), x[2]["name"]))
    groups = []
    for body in list(BODY) + ["OTHERS"]:
        mine = [m for mid, tab, m in entries if body_of(mid, tab) == body]
        if mine:
            groups.append({"name": body, "models": mine})
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).date().isoformat()
    out = {"renderV": RENDER_V, "checkedAt": now, "source": PAGE, "groups": groups, "pdfs": docs}
    DATA.write_text("// Dijana oleh scripts/pricelist.py — jangan sunting tangan\nwindow.PRICELIST = " +
                    json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    every = [p for _, _, m in entries for p in m["pages"]] + [p for d in docs.values() for p in d["pages"]]
    used = {p[k].split("/", 1)[1] for p in every for k in ("img",)}
    for f in list(IMG.glob("*.webp")) + list(IMG.glob("*.jpg")):
        if f.name not in used:
            f.unlink()
    print("Senarai harga: %d model, %d PDF, dikemas kini: %d" % (len(entries), len(docs), len(changed)))
    if failed:
        print("::warning::Gagal (versi lama dikekalkan jika ada): " + "; ".join(failed))
    for g in groups:
        for m in g["models"]:
            print(" ", g["name"], "|", m["id"], "|", m["name"], "|", ",".join("+".join(p["types"]) for p in m["pages"]), "|", m["effective"] or "(tiada tarikh)")


if __name__ == "__main__":
    main()
