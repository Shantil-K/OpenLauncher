#!/usr/bin/env python3
# SPDX-License-Identifier: WTFNMFPL
"""Builds src/js/onlinewallpapers.js: the online photo albums offered in Settings > Wallpaper > My wallpapers.

The photos are Wikimedia Commons "featured pictures" (picked by the Commons community for quality), under free licenses
(public domain, CC0, CC BY, CC BY-SA). Only landscape photos at least 3840 pixels wide are kept, and the TV loads Commons'
own 3840-pixel copy of each, so they are sharp on a 4K TV without downloading the full original. Each photo keeps its
author, license and page, which the launcher shows in its "Now playing" card, as the licenses ask.

    python3 scripts/make-online-wallpapers.py          # refresh the list (needs the internet)
"""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
AGENT = "OpenLauncher/2 (https://github.com/Shantil-K/OpenLauncher; wallpaper list builder)"
PER_ALBUM = 12
WIDTH = 3840

# album id, name, the Commons categories it draws from
ALBUMS = [
    ("landscapes", "Landscapes", ["Category:Featured pictures of landscapes"]),
    ("mountains", "Mountains", ["Category:Featured pictures of mountains"]),
    ("water", "Seas and lakes", ["Category:Featured pictures of bodies of water"]),
    ("forests", "Forests", ["Category:Featured pictures of forests"]),
    ("night", "Night skies", ["Category:Featured pictures of astronomy", "Category:Featured pictures of night"]),
    ("cities", "Cities", ["Category:Featured pictures of cityscapes"]),
]

FREE = re.compile(r"^(public domain|pd|cc0|cc by(-sa)? [0-9.]+( [a-z-]+)?)$", re.I)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "js", "onlinewallpapers.js")


def get(params):
    params = dict(params, format="json", formatversion="2")
    request = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def plain(text, limit):
    """Commons metadata is HTML: keep the words only."""
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()[:limit]


def photos(category):
    found, cont = [], {}
    while len(found) < 400:
        data = get(dict({
            "action": "query", "generator": "categorymembers", "gcmtitle": category, "gcmtype": "file", "gcmlimit": "50",
            "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": str(WIDTH),
        }, **cont))
        for page in data.get("query", {}).get("pages", []):
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata", {})
            license_name = plain(meta.get("LicenseShortName", {}).get("value", ""), 40)
            width, height = info.get("width", 0), info.get("height", 0)
            thumb = info.get("thumburl", "").split("?")[0]      # Commons adds tracking parameters (utm_...): not needed
            if info.get("mime") != "image/jpeg" or width < WIDTH or not height or not (1.3 <= width / height <= 2.0):
                continue
            if not FREE.match(license_name) or not re.match(r"^https://(upload|thumb)\.wikimedia\.org/wikipedia/commons/thumb/", thumb):
                continue
            found.append({
                "u": thumb,
                "t": thumb.replace("/%dpx-" % WIDTH, "/330px-"),
                "n": plain(meta.get("ObjectName", {}).get("value", "") or page["title"][5:].rsplit(".", 1)[0], 80),
                "by": plain(meta.get("Artist", {}).get("value", ""), 60) or "Unknown",
                "lic": license_name,
                "page": info.get("descriptionurl", ""),
            })
        if "continue" not in data:
            break
        cont = data["continue"]
    return found


def main():
    albums = []
    seen = set()          # each photo in one album only
    for album_id, name, categories in ALBUMS:
        chosen = []
        for category in categories:
            for photo in photos(category):
                if photo["u"] in seen or "/%dpx-" % WIDTH not in photo["u"]:
                    continue
                seen.add(photo["u"])
                chosen.append(photo)
        chosen = chosen[:PER_ALBUM]
        print("%-12s %d photos" % (album_id, len(chosen)), file=sys.stderr)
        if chosen:
            albums.append({"id": album_id, "name": name, "photos": chosen})
    text = ("//SPDX-License-Identifier: WTFNMFPL\n"
            "// Made by scripts/make-online-wallpapers.py: online photo albums for My wallpapers (background.js). The photos are\n"
            "// Wikimedia Commons featured pictures, each under its own free license, with its author and page; the launcher shows\n"
            "// those in the Now playing card. u: the 3840 px copy, t: a small preview, n: title, by: author, lic: license.\n"
            "const ONLINE_ALBUMS=" + json.dumps(albums, ensure_ascii=False, indent=1) + ";\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print("wrote", os.path.normpath(OUT), file=sys.stderr)


if __name__ == "__main__":
    main()
