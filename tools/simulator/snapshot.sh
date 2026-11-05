#!/bin/sh
# Copies what the simulator needs from a rooted TV with OpenLauncher on it: its app list, app icons, inputs, running apps,
# 12/24-hour setting and OpenLauncher's saved settings (your layout, wallpapers, look). It goes into tools/simulator/snapshot,
# which is never committed: it holds your settings and the app makers' icons.
# Needs SSH as root (key login) and Node.js 22+.
#   tools/simulator/snapshot.sh 192.168.0.201
set -eu
TV="${1:?usage: $0 <TV address>}"
cd "$(dirname "$0")"
OUT=snapshot
PORT=9998

# OpenLauncher keeps the TV's web debugger off the network, so reach it through SSH
ssh -o ExitOnForwardFailure=yes -fN -L "$PORT:localhost:9998" "root@$TV" 2>/dev/null || true
ssh "root@$TV" "sleep 1 | luna-send -n 1 luna://com.webos.applicationManager/launch '{\"id\":\"com.homebrew.openlauncher\"}' >/dev/null"
sleep 4

rm -rf "$OUT"
mkdir -p "$OUT/fs"
node snapshot.mjs > "$OUT/snapshot.json"
python3 -I - "$OUT/snapshot.json" "$OUT" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
icons = data.pop("icons", [])
with open(sys.argv[2] + "/data.js", "w") as f:
    f.write("// Made by tools/simulator/snapshot.sh from a TV. Not committed.\nwindow.OL_SIM=" + json.dumps(data) + ";\n")
with open(sys.argv[2] + "/icons.txt", "w") as f:
    f.write("\n".join(sorted(set(icons))) + "\n")
print("%d apps, %d icons" % (len(data["apps"]), len(set(icons))))
PY
# the icons, at the same paths as on the TV (the launcher loads them through its "hack" link to /)
ssh "root@$TV" "tar cf - -T - 2>/dev/null" < "$OUT/icons.txt" | tar xf - -C "$OUT/fs" 2>/dev/null || true
echo "Snapshot saved in tools/simulator/$OUT. Now run tools/simulator/run.sh"
