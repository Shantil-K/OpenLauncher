import json
import urllib.request

url = "https://raw.githubusercontent.com/conreo/couchy-launcher/main/app/src/main/assets/aerials.json"
req = urllib.request.urlopen(url)
items = json.loads(req.read().decode("utf-8"))

src_names = {
    "A": "Apple",
    "Z": "Amazon",
    "C1": "Community (Aerial)",
    "C2": "Community (RobinFrcd)",
}

with open("aerials.m3u", "w", encoding="utf-8") as out:
    out.write("#EXTM3U\n")
    for item in items:
        group = src_names.get(item.get("s"), "Other")
        title = item.get("t", "Aerial")
        video_url = item.get("u")
        out.write(f'#EXTINF:-1 group-title="{group}",{group} - {title}\n{video_url}\n')

print(f"Created aerials.m3u with {len(items)} videos")
