#!/usr/bin/env bash
# Run home-watch.py in the background on a Linux machine that stays on (a Raspberry Pi, a home server): starts at boot,
# restarts if it stops. Uses a systemd user service.
#   TV_HOST=192.168.1.50 ./install-linux.sh            # install / update
#   ./install-linux.sh uninstall
# Log: journalctl --user -u openlauncher-home-watch -f
set -euo pipefail
cd "$(dirname "$0")"
UNIT=openlauncher-home-watch.service
UNIT_FILE="$HOME/.config/systemd/user/$UNIT"

if [ "${1:-}" = uninstall ]; then
  systemctl --user disable --now "$UNIT" 2>/dev/null || true
  rm -f "$UNIT_FILE"
  systemctl --user daemon-reload
  echo "Removed. Home opens LG's home again."
  exit 0
fi

: "${TV_HOST:?set TV_HOST to the TV IP address, e.g. TV_HOST=192.168.1.50 $0}"
[ -x venv/bin/python ] || python3 -m venv venv
venv/bin/pip install -q websockets

# pair once in the foreground, so the prompt on the TV can be accepted
if [ ! -f .lgtv-key.json ]; then
  echo "Accept the prompt on the TV, then press Ctrl+C once it says 'connected'."
  venv/bin/python -u home-watch.py "$TV_HOST" || true
fi

mkdir -p "$(dirname "$UNIT_FILE")"
cat > "$UNIT_FILE" <<UNIT
[Unit]
Description=OpenLauncher: open OpenLauncher when LG's Home shows
After=network-online.target

[Service]
WorkingDirectory=$PWD
ExecStart=$PWD/venv/bin/python -u $PWD/home-watch.py $TV_HOST
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
UNIT
systemctl --user daemon-reload
systemctl --user enable --now "$UNIT"
# keep it running when nobody is logged in
loginctl enable-linger "$USER" 2>/dev/null || echo "Run 'sudo loginctl enable-linger $USER' so it keeps running after you log out."
echo "Running. Press Home on the remote."
