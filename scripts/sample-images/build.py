"""サンプルアイテム画像（実物写真 → 背景透過PNG）を作るスクリプト。

使い方（ネットワークで commons.wikimedia.org / upload.wikimedia.org、Pexels を使う場合は api.pexels.com / images.pexels.com に届く環境で）:
  環境変数 PIXABAY_API_KEY / UNSPLASH_ACCESS_KEY / PEXELS_API_KEY のどれかがあればそのサイト、なければ Wikimedia Commons から候補を集める。
  Commons は User-Agent に連絡先がないと 429 になりやすい。ゆっくり取得すること。
  pip install "rembg[cpu]" pillow requests
  python -I build.py fetch            # catalog.json の各アイテムについて候補写真を cand/<slug>/ に集め、contact sheet を作る
  # cand/_sheets/<slug>.jpg を目で見て、使う候補番号を picks.json に書く  {"tee-navy": 3, ...}
  python -I build.py cut              # picks.json の写真を背景除去して public/mock/items/<slug>.webp に書き出す
                                      # （"seg" 指定は着用写真から服だけを切り出す）
  python -I build.py track            # Unsplash の写真は使用をダウンロード通知する（API ガイドライン）
  python -I build.py credits          # 出典とライセンスを public/mock/items/CREDITS.md に書き出す
  python -I build.py seeds            # catalog.json からデモデータ（mock-data.ts / supabase/seed.sql）を書き直す

使う写真は CC0 / パブリックドメイン / CC BY / CC BY-SA のみ（帰属表示は CREDITS.md）。
ブランドロゴが目立つ写真は picks で選ばないこと。
"""

import io
import json
import os
import sys
import time
from pathlib import Path

import requests
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CAND = HERE / "cand"
OUT = ROOT / "public" / "mock" / "items"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "sample-image-builder/0.1 (python-requests)"}
OK_LICENSES = ("cc0", "public domain", "pd", "cc by", "cc-by")  # CC BY-SA も "cc by" で拾う。NC/ND は除外
N_CAND = 20
MAX_SIDE = 720


def get(url, **kw):
    """429/5xx のときは待って再試行する（Wikimedia のレート制限対策）。"""
    for attempt in range(6):
        r = requests.get(url, headers=UA, timeout=60, **kw)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(float(r.headers.get("retry-after") or 2 ** attempt * 3))
            continue
        r.raise_for_status()
        time.sleep(0.5)
        return r
    r.raise_for_status()
    return r


def catalog():
    return json.loads((HERE / "catalog.json").read_text())


def license_ok(name: str) -> bool:
    n = name.lower()
    if "nc" in n.replace("-", " ").split() or "nd" in n.replace("-", " ").split():
        return False
    return n.startswith(OK_LICENSES)


def search(query: str):
    """キーがある写真サイトを優先して検索する（Pixabay → Unsplash → Pexels → Wikimedia Commons）。"""
    if os.environ.get("PIXABAY_API_KEY"):
        return search_pixabay(query)
    if os.environ.get("UNSPLASH_ACCESS_KEY"):
        return search_unsplash(query)
    if os.environ.get("PEXELS_API_KEY"):
        return search_pexels(query)
    return search_commons(query)


def search_pixabay(query: str):
    # Pixabay Content License: 無料・商用可・帰属表示不要。画像はダウンロードして同梱する（直リンク不可）。
    r = requests.get("https://pixabay.com/api/", params={
        "key": os.environ["PIXABAY_API_KEY"], "q": f"{query} white background"[:100], "image_type": "photo",
        "safesearch": "true", "per_page": 30, "order": "popular",
    }, timeout=30)
    r.raise_for_status()
    return [{
        "title": h.get("tags") or f"Pixabay {h['id']}", "page": h["pageURL"], "url": h["largeImageURL"],
        "license": "Pixabay Content License", "license_url": "https://pixabay.com/service/license-summary/",
        "artist": h.get("user", ""),
    } for h in r.json().get("hits", [])]


UNSPLASH_API = "https://api.unsplash.com"


def unsplash_get(path: str, **params):
    """Unsplash API 呼び出し。Demo 枠（1時間50リクエスト）を使い切ったらリセットまで待つ。"""
    while True:
        r = requests.get(UNSPLASH_API + path, params=params, timeout=30,
                         headers={"Authorization": f"Client-ID {os.environ['UNSPLASH_ACCESS_KEY']}", "Accept-Version": "v1"})
        if r.status_code == 403 and r.headers.get("X-Ratelimit-Remaining") == "0":
            print("Unsplash の1時間の上限に達したので5分待って再試行します", flush=True)
            time.sleep(300)
            continue
        r.raise_for_status()
        if r.headers.get("X-Ratelimit-Remaining") == "0":
            print("Unsplash の上限に達しました。次の呼び出しは1時間後になります", flush=True)
        return r


def search_unsplash(query: str):
    # Unsplash License: 無料・商用可・帰属表示不要（推奨）。1アイテム=1リクエスト。
    r = unsplash_get("/search/photos", query=query, per_page=30, content_filter="high")
    return [{
        "title": p.get("alt_description") or f"Unsplash {p['id']}", "page": p["links"]["html"],
        "url": p["urls"]["raw"] + "&w=1200&fm=jpg&q=85",
        "license": "Unsplash License", "license_url": "https://unsplash.com/license",
        "artist": p.get("user", {}).get("name", ""),
        "download_location": p["links"]["download_location"],
    } for p in r.json().get("results", [])]


def unsplash_track_download(meta: dict):
    """Unsplash の API ガイドライン: 実際に使う写真はダウンロードを通知する（1枚=1リクエスト）。"""
    loc = meta.get("download_location")
    if loc and os.environ.get("UNSPLASH_ACCESS_KEY"):
        unsplash_get(loc.replace(UNSPLASH_API, ""))


def search_pexels(query: str):
    # Pexels ライセンス: 無料・商用可・帰属表示不要（任意）。CREDITS.md には撮影者を記載する。
    r = requests.get(
        "https://api.pexels.com/v1/search",
        params={"query": f"{query} white background", "per_page": 30, "orientation": "square"},
        headers={"Authorization": os.environ["PEXELS_API_KEY"]}, timeout=30,
    )
    r.raise_for_status()
    return [{
        "title": p.get("alt") or f"Pexels {p['id']}", "page": p["url"], "url": p["src"]["large2x"],
        "license": "Pexels License", "license_url": "https://www.pexels.com/license/",
        "artist": p.get("photographer", ""),
    } for p in r.json().get("photos", [])]


def search_commons(query: str):
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": f"{query} filetype:bitmap", "gsrlimit": 50,
        "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1200,
    }
    pages = get(API, params=params).json().get("query", {}).get("pages", {})
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
    only = set(sys.argv[2:])
    for item in catalog():
        if only and item["slug"] not in only:
            continue
        if (CAND / item["slug"] / "meta.json").exists():  # 取得済みは検索しない（API 枠の節約）
            continue
        d = CAND / item["slug"]
        d.mkdir(exist_ok=True)
        found = search(item["query"])[:N_CAND]
        thumbs = []
        for i, c in enumerate(found):
            try:
                img = Image.open(io.BytesIO(get(c["url"]).content)).convert("RGB")
            except Exception as e:  # noqa: BLE001
                print("skip", c["title"], e)
                continue
            img.save(d / f"{i:02d}.jpg", quality=92)
            thumbs.append((i, img))
        (d / "meta.json").write_text(json.dumps(found, ensure_ascii=False, indent=1))
        sheet = Image.new("RGB", (5 * 260, 4 * 280), "white")
        draw = ImageDraw.Draw(sheet)
        for k, (i, img) in enumerate(thumbs[:N_CAND]):
            t = img.copy()
            t.thumbnail((250, 250))
            x, y = (k % 5) * 260, (k // 5) * 280
            sheet.paste(t, (x + 5, y + 5))
            draw.text((x + 8, y + 258), f"#{i} {found[i]['license'][:20]}", fill="black")
        sheet.save(CAND / "_sheets" / f"{item['slug']}.jpg", quality=85)
        print(item["slug"], len(thumbs), "candidates")


def _pick(spec):
    """picks.json の値: 候補番号（int）か {"i": 番号, "from": 別アイテムの slug, "seg": "upper"|"lower"|"upper+full", "crop": [左, 上, 右, 下]（割合）, "fill": true（穴を塞ぐ）}。"""
    return {"i": spec} if isinstance(spec, int) else spec


def _keep_main(alpha):
    """背景除去の取りこぼし（小さな島）を消して、大きな塊だけ残す。"""
    import numpy as np
    from scipy import ndimage

    a = np.asarray(alpha)
    lab, n = ndimage.label(a > 128)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
    keep = np.isin(lab, [k + 1 for k, sz in enumerate(sizes) if sz >= sizes.max() * 0.15])
    keep = ndimage.binary_dilation(keep, iterations=3)
    return Image.fromarray(np.where(keep, a, 0).astype("uint8"))


def _fill_holes(img):
    """服の内側に開いた穴（前に出ていた手など）を塞ぎ、周りの布の色で埋める（pip install opencv-python-headless）。"""
    import cv2
    import numpy as np
    from scipy import ndimage

    a = np.asarray(img.getchannel("A"))
    solid = a > 128
    filled = ndimage.binary_fill_holes(solid)
    hole = filled & ~solid
    if not hole.any():
        return img
    rgb = cv2.inpaint(np.asarray(img.convert("RGB")), ndimage.binary_dilation(hole, iterations=4).astype("uint8") * 255, 9, cv2.INPAINT_TELEA)
    out = Image.fromarray(rgb).convert("RGBA")
    out.putalpha(Image.fromarray(np.where(filled, 255, a).astype("uint8")))
    return out


def cut():
    from PIL import ImageChops, ImageFilter
    from rembg import new_session, remove

    session = new_session("isnet-general-use")
    cloth = None
    picks = json.loads((HERE / "picks.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[2:])
    for slug, spec in picks.items():
        if only and slug not in only:
            continue
        p = _pick(spec)
        src_slug = p.get("from", slug)
        src = Image.open(CAND / src_slug / f"{p['i']:02d}.jpg").convert("RGB")
        if "crop" in p:
            l, t, r, b = p["crop"]
            src = src.crop((int(l * src.width), int(t * src.height), int(r * src.width), int(b * src.height)))
        cutout = remove(src, session=session, post_process_mask=True)
        if "seg" in p:
            # 着用写真から服だけを取り出す（u2net_cloth_seg の部位マスク × 人物の輪郭）
            cloth = cloth or new_session("u2net_cloth_seg")
            mask = Image.new("L", src.size, 0)
            for part in p["seg"].split("+"):
                mask = ImageChops.lighter(mask, cloth.predict(src, cc=part)[0].resize(src.size))
            mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))
            cutout.putalpha(ImageChops.darker(cutout.getchannel("A"), mask))
        cutout.putalpha(_keep_main(cutout.getchannel("A")))
        if p.get("fill"):
            cutout = _fill_holes(cutout)
        bbox = cutout.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
        if bbox:
            cutout = cutout.crop(bbox)
        cutout.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        cutout.save(OUT / f"{slug}.webp", quality=88, method=6)  # 透過WebP（PNG の約1/10の容量）
        print("wrote", slug)


def track():
    """Unsplash の API ガイドライン: 実際に使う写真はダウンロードを通知する（1枚=1リクエスト、同じ写真は1回）。"""
    picks = json.loads((HERE / "picks.json").read_text())
    done_path = CAND / "_tracked.json"
    done = set(json.loads(done_path.read_text())) if done_path.exists() else set()
    for slug, spec in picks.items():
        p = _pick(spec)
        meta = json.loads((CAND / p.get("from", slug) / "meta.json").read_text())[p["i"]]
        if meta.get("download_location") and meta["page"] not in done:
            unsplash_track_download(meta)
            done.add(meta["page"])
            done_path.write_text(json.dumps(sorted(done)))
            print("tracked", slug)


def credits():
    picks = json.loads((HERE / "picks.json").read_text())
    names = {i["slug"]: i["name"] for i in catalog()}
    lines = ["# サンプル画像の出典", "",
             "以下の写真を背景除去・トリミングして使用しています（着用写真は服の部分だけを切り出し）。", ""]
    for slug, spec in picks.items():
        p = _pick(spec)
        m = json.loads((CAND / p.get("from", slug) / "meta.json").read_text())[p["i"]]
        lines.append(f"- `{slug}.webp`（{names.get(slug, slug)}）: [{m['title']}]({m['page']}) / {m['license']}"
                     + (f" ({m['license_url']})" if m["license_url"] else "") + " / 作者: " + _strip(m["artist"]))
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n")


def seeds():
    """catalog.json からデモ用データ（src/lib/mock-data.ts の seeds と supabase/seed.sql のアイテム）を書き直す。id は catalog の並び順。"""
    import re

    items = catalog()
    ids = {i["slug"]: f"10000000-0000-0000-0000-{n:012d}" for n, i in enumerate(items, 1)}
    ts_rows = []
    for i in items:
        seed = {"id": ids[i["slug"]], "name": i["name"], "image_url": f"/mock/items/{i['slug']}.webp",
                "category": i["category"], "sub_category": i["sub_category"], "scene_tags": i["scene_tags"],
                "color": i["color"], "style_tags": i["style_tags"], "season_tags": i["season_tags"]}
        body = ", ".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in seed.items())
        ts_rows.append(f"  {{ {body}, overlay: null }},")
    ts = ROOT / "src" / "lib" / "mock-data.ts"
    src = re.sub(r"(const seeds: Seed\[\] = \[\n).*?(\n\];)", lambda m: m.group(1) + "\n".join(ts_rows) + m.group(2),
                 ts.read_text(), count=1, flags=re.S)
    ts.write_text(src)

    label = {"tops": "トップス", "bottoms": "ボトムス", "outer": "アウター", "shoes": "靴", "headwear": "帽子", "accessory": "小物"}
    arr = lambda xs: "'{" + ",".join(xs) + "}'"  # noqa: E731
    sql_rows, prev = [], None
    for i in items:
        if i["category"] != prev:
            sql_rows.append(f"  -- {label[i['category']]}")
            prev = i["category"]
        sql_rows.append(
            f"  ('{ids[i['slug']]}', '00000000-0000-0000-0000-000000000001',\n"
            f"   '{i['name']}', '/mock/items/{i['slug']}.webp', '{i['category']}', '{i['sub_category']}',\n"
            f"   {arr(i['scene_tags'])}, '{i['color']}', {arr(i['style_tags'])}, {arr(i['season_tags'])}, null),")
    sql = ROOT / "supabase" / "seed.sql"
    body = "\n".join(sql_rows).rstrip(",")
    src = re.sub(r"(insert into public\.stylist_items \([^)]*\) values\n).*?(\non conflict \(id\) do nothing;)",
                 lambda m: m.group(1) + body + m.group(2), sql.read_text(), count=1, flags=re.S)
    sql.write_text(src)
    print("wrote", ts.relative_to(ROOT), sql.relative_to(ROOT))


def _strip(html: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", html).strip() or "不明"


if __name__ == "__main__":
    {"fetch": fetch, "cut": cut, "track": track, "credits": credits, "seeds": seeds}[sys.argv[1]]()
