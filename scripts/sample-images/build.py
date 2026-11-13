"""サンプルアイテム画像（実物写真 → 背景透過PNG）を作るスクリプト。

使い方（ネットワークで commons.wikimedia.org / upload.wikimedia.org に届く環境で）:
  pip install "rembg[cpu]" pillow requests
  python -I build.py fetch            # catalog.json の各アイテムについて候補写真を cand/<slug>/ に集め、contact sheet を作る
  # cand/_sheets/<slug>.jpg を目で見て、使う候補番号を picks.json に書く  {"tee-navy": 3, ...}
  python -I build.py cut              # picks.json の写真を背景除去して public/mock/items/<slug>.png に書き出す
  python -I build.py credits          # 出典とライセンスを public/mock/items/CREDITS.md に書き出す

使う写真は CC0 / パブリックドメイン / CC BY / CC BY-SA のみ（帰属表示は CREDITS.md）。
ブランドロゴが目立つ写真は picks で選ばないこと。
"""

import io
import json
import sys
from pathlib import Path

import requests
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CAND = HERE / "cand"
OUT = ROOT / "public" / "mock" / "items"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "ai-stylist-sample-builder/0.1"}
OK_LICENSES = ("cc0", "public domain", "pd", "cc by", "cc-by")  # CC BY-SA も "cc by" で拾う。NC/ND は除外
N_CAND = 12
MAX_SIDE = 900


def catalog():
    return json.loads((HERE / "catalog.json").read_text())


def license_ok(name: str) -> bool:
    n = name.lower()
    if "nc" in n.replace("-", " ").split() or "nd" in n.replace("-", " ").split():
        return False
    return n.startswith(OK_LICENSES)


def search(query: str):
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": f"{query} filetype:bitmap", "gsrlimit": 50,
        "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1200,
    }
    pages = requests.get(API, params=params, headers=UA, timeout=30).json().get("query", {}).get("pages", {})
    out = []
    for p in sorted(pages.values(), key=lambda p: p.get("index", 0)):
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if not license_ok(lic) or min(ii.get("width", 0), ii.get("height", 0)) < 500:
            continue
        out.append({
            "title": p["title"], "page": ii.get("descriptionurl"), "url": ii.get("thumburl") or ii.get("url"),
            "license": lic, "license_url": meta.get("LicenseUrl", {}).get("value", ""),
            "artist": meta.get("Artist", {}).get("value", ""),
        })
    return out


def fetch():
    (CAND / "_sheets").mkdir(parents=True, exist_ok=True)
    for item in catalog():
        d = CAND / item["slug"]
        d.mkdir(exist_ok=True)
        found = search(item["query"])[:N_CAND]
        thumbs = []
        for i, c in enumerate(found):
            try:
                img = Image.open(io.BytesIO(requests.get(c["url"], headers=UA, timeout=60).content)).convert("RGB")
            except Exception as e:  # noqa: BLE001
                print("skip", c["title"], e)
                continue
            img.save(d / f"{i:02d}.jpg", quality=92)
            thumbs.append((i, img))
        (d / "meta.json").write_text(json.dumps(found, ensure_ascii=False, indent=1))
        sheet = Image.new("RGB", (4 * 260, 3 * 280), "white")
        draw = ImageDraw.Draw(sheet)
        for k, (i, img) in enumerate(thumbs[:12]):
            t = img.copy()
            t.thumbnail((250, 250))
            x, y = (k % 4) * 260, (k // 4) * 280
            sheet.paste(t, (x + 5, y + 5))
            draw.text((x + 8, y + 258), f"#{i} {found[i]['license'][:20]}", fill="black")
        sheet.save(CAND / "_sheets" / f"{item['slug']}.jpg", quality=85)
        print(item["slug"], len(thumbs), "candidates")


def cut():
    from rembg import new_session, remove

    session = new_session("isnet-general-use")
    picks = json.loads((HERE / "picks.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, idx in picks.items():
        src = Image.open(CAND / slug / f"{idx:02d}.jpg")
        cutout = remove(src, session=session, post_process_mask=True)
        bbox = cutout.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
        if bbox:
            cutout = cutout.crop(bbox)
        cutout.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        cutout.save(OUT / f"{slug}.png", optimize=True)
        print("wrote", slug)


def credits():
    picks = json.loads((HERE / "picks.json").read_text())
    names = {i["slug"]: i["name"] for i in catalog()}
    lines = ["# サンプル画像の出典", "", "Wikimedia Commons の写真を背景除去・トリミングして使用しています。", ""]
    for slug, idx in picks.items():
        m = json.loads((CAND / slug / "meta.json").read_text())[idx]
        lines.append(f"- `{slug}.png`（{names.get(slug, slug)}）: [{m['title']}]({m['page']}) / {m['license']}"
                     + (f" ({m['license_url']})" if m["license_url"] else "") + " / 作者: " + _strip(m["artist"]))
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n")


def _strip(html: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", html).strip() or "不明"


if __name__ == "__main__":
    {"fetch": fetch, "cut": cut, "credits": credits}[sys.argv[1]]()
