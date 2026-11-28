#!/usr/bin/env python3
"""Gambar sisi kereta untuk kad model di /pricelist/ dan /maxcheck/.

Sumber: menu "Models" Toyota Malaysia (window.data_global_nav_models, ada pada setiap halaman toyota.com.my),
satu gambar sisi lutsinar untuk setiap model yang dijual. Disimpan img/side/<nama>.webp + img/side/index.json
(nama model dinormalkan -> fail). Dijalankan oleh pricelist.yml & maxcheck.yml setiap minggu.
Jika laman gagal dibaca, gambar & index lama dikekalkan."""
import io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "img" / "side"
SITE = "https://www.toyota.com.my"
PAGE = SITE + "/en/price-and-model-tools/model-brochures.html"
UA = {"User-Agent": "Mozilla/5.0 (wanjasni toyota site updater)"}
WIDTH = 520
MIN_MODELS = 12


def fetch(url):
    url = urllib.parse.quote(url, safe=":/()%?=&,.-_~")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return r.read()


def norm(s):
    s = " ".join(re.sub(r"<[^>]+>", " ", s).split()).upper()
    s = re.sub(r"^(ALL-NEW|NEW)\s+", "", s)
    return s.replace("HYBRID ELECTRIC", "HEV")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    html = fetch(PAGE).decode("utf-8", "replace")
    m = re.search(r"window\.data_global_nav_models\s*=\s*(?=[\[{])", html)
    if not m:
        sys.exit("data_global_nav_models tiada; gambar sisi lama dikekalkan.")
    nav = json.JSONDecoder().raw_decode(html, m.end())[0]
    found = {}

    def walk(o):
        if isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, dict):
            name = o.get("header") or o.get("title") or o.get("label") or o.get("name")
            img = next((v for v in o.values() if isinstance(v, str) and re.search(r"\.(png|webp)$", v, re.I)
                        and re.search(r"explore|navi|thumbnail", v, re.I)), None)
            if name and img:
                found.setdefault(norm(str(name)), img)
            for v in o.values():
                walk(v)

    walk(nav)
    if len(found) < MIN_MODELS:
        sys.exit("Hanya %d gambar sisi dijumpai; gambar lama dikekalkan." % len(found))
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        index = json.loads((OUT / "index.json").read_text(encoding="utf-8"))
    except Exception:
        index = {}
    new = {}
    for name, src in found.items():
        f = slug(name) + ".webp"
        try:
            im = Image.open(io.BytesIO(fetch(SITE + src))).convert("RGBA")
            im = im.crop(im.getbbox() or (0, 0, im.width, im.height))
            if im.width > WIDTH:
                im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
            im.save(OUT / f, "WEBP", quality=85, method=6)
            new[name] = "img/side/" + f
        except Exception as e:
            if name in index and (ROOT / index[name]).exists():
                new[name] = index[name]
            print("::warning::gambar sisi %s gagal (%s)" % (name, e))
    (OUT / "index.json").write_text(json.dumps(dict(sorted(new.items())), indent=1), encoding="utf-8", newline="\n")
    keep = {Path(p).name for p in new.values()} | {"index.json"}
    for f in OUT.iterdir():
        if f.name not in keep:
            f.unlink()  # model yang Toyota buang dari menu
    print("Gambar sisi: %d model (%s)" % (len(new), ", ".join(sorted(new))))


if __name__ == "__main__":
    main()
