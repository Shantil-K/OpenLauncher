#!/bin/sh
# Live simulator for working on the launcher: serves src/ as it is (serve.mjs) and opens it in a 1920x1080 Chrome window.
# Save a file and the window follows: CSS changes apply at once, anything else reloads the page. Ctrl+C stops it.
#   tools/simulator/dev.sh
set -eu
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
node serve.mjs "$PORT" &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT INT TERM
sleep 1
CHROME=$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)
mkdir -p build/profile-live
"$CHROME" --user-data-dir="$(pwd)/build/profile-live" --no-first-run --no-default-browser-check --disable-translate \
	--autoplay-policy=no-user-gesture-required --force-device-scale-factor=1 --window-size=1920,1080 \
	--ignore-gpu-blocklist --enable-features=AcceleratedVideoDecodeLinuxGL,VaapiVideoDecoder \
	--app="http://localhost:$PORT/" >/dev/null 2>&1 || true
