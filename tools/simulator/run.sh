#!/bin/sh
# Runs OpenLauncher (src/) in a full-screen Chrome window, with tools/simulator standing in for the TV, for recording
# demos. Uses the snapshot from snapshot.sh if there is one (your apps, icons and settings), else a few sample apps.
#   tools/simulator/run.sh            full screen (Alt+F4 to quit)
#   WINDOW=1 tools/simulator/run.sh   a 1920x1080 window instead
#   HEADLESS=1 tools/simulator/run.sh headless, 1920x1080, with the DevTools protocol on port 9333 (for scripted recordings)
#   DEBUG=1 tools/simulator/run.sh    full screen, with the DevTools protocol on port 9333
# Keys: arrows move, Enter is OK, Esc or Backspace is Back, 1 2 3 4 are the red, green, yellow and blue buttons.
set -eu
cd "$(dirname "$0")"
SIM=$(pwd)
APP="$SIM/build/app"
rm -rf "$SIM/build/app"
mkdir -p "$APP/sim" "$SIM/build/profile"
cp -r ../../src/. "$APP/"
cp mock.js sim.css pointer.svg pointer-pressed.svg frame.html frame.js "$APP/sim/"
if [ -f snapshot/data.js ]; then
	cp snapshot/data.js "$APP/sim/data.js"
	ln -s "$SIM/snapshot/fs" "$APP/hack"
else
	echo "window.OL_SIM={};" > "$APP/sim/data.js"
	echo "No snapshot yet (tools/simulator/snapshot.sh <TV address>): using sample apps."
fi
# the simulator goes in before the launcher's own scripts
python3 -I - "$APP/index.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
first = s.index('<script src="js/')
s = s[:first] + '<link rel="stylesheet" href="sim/sim.css">\n<script src="sim/data.js"></script>\n<script src="sim/mock.js"></script>\n' + s[first:]
open(p, "w").write(s)
PY
# BUILD_ONLY=1: just make build/app (to serve it to another device, such as a tablet for recording)
[ "${BUILD_ONLY:-}" = 1 ] && { echo "Built $APP"; exit 0; }
CHROME=$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)
[ "${LIGHTVIDEO:-}" = 1 ] && echo "window.OL_SIM.lightVideo=true;" >> "$APP/sim/data.js"
# video decoding on the graphics chip where Chrome supports it (Intel VA-API on Linux), so the CPU stays free for recording
GPU="--ignore-gpu-blocklist --enable-features=AcceleratedVideoDecodeLinuxGL,AcceleratedVideoDecodeLinuxZeroCopyGL,VaapiVideoDecoder"
if [ "${HEADLESS:-}" = 1 ]; then SIZE="--headless=new --window-size=1920,1080 --remote-debugging-port=9333 --hide-scrollbars"
elif [ "${WINDOW:-}" = 1 ]; then SIZE="--window-size=1920,1080"; else SIZE="--kiosk"; fi
# DEBUG=1: also the DevTools protocol on port 9333, to drive a recording with a script
if [ "${DEBUG:-}" = 1 ] && [ "${HEADLESS:-}" != 1 ]; then SIZE="$SIZE --remote-debugging-port=9333"; fi
exec "$CHROME" --user-data-dir="$SIM/build/profile" --no-first-run --no-default-browser-check --disable-translate \
	--allow-file-access-from-files --autoplay-policy=no-user-gesture-required --force-device-scale-factor=1 $GPU \
	$SIZE --app="file://$APP/index.html"
