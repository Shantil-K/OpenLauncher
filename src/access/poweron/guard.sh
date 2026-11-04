#!/bin/sh
# OpenLauncher: "When the TV turns on, open OpenLauncher" (Settings > TV, see src/js/poweron.js).
#
# The TV's boot daemon (bootd) picks the first app from /etc/palm/bootd.json, or from /var/luna/preferences/bootd.json
# when that exists. OpenLauncher writes that second file: LG's own file with the power button pointed at the launcher.
# Homebrew Channel runs this check at every start (a copy of it lives in /var/lib/webosbrew/init.d). It:
#   - notes whether bootd loaded OpenLauncher's copy this time (so Settings can say if a restart is still needed)
#   - removes the copy if OpenLauncher was uninstalled, so the TV goes back to Live TV
#   - removes the copy if a software update changed LG's file, so an old copy never hides the new one
# A copy OpenLauncher didn't write (another app's) is never touched.
#
# Everything it reads and runs is in folders only root can write to (/var/lib/webosbrew), never in /media/developer or
# /tmp, which any app on the TV can write to: this runs as root at every start.
# To undo it by hand over SSH:  sh /var/lib/webosbrew/init.d/45-openlauncher-poweron remove

DIR=/var/lib/webosbrew/openlauncher/poweron
OVERRIDE=/var/luna/preferences/bootd.json
STOCK=/etc/palm/bootd.json
SELF=/var/lib/webosbrew/init.d/45-openlauncher-poweron

sum () { md5sum "$1" 2>/dev/null | cut -d ' ' -f 1; }

ours () { [ -f "$OVERRIDE" ] && [ -n "$(sum "$OVERRIDE")" ] && [ "$(sum "$OVERRIDE")" = "$(cat "$DIR/override.md5" 2>/dev/null)" ]; }

remove () {
	if ours; then rm -f "$OVERRIDE"; fi
	rm -f "$SELF"
	rm -rf "$DIR"
	sync
}

if [ "$1" = "remove" ]; then
	remove
	echo removed
	exit 0
fi

# The note is for this start only, so it goes in /tmp (empty at every start; LG's snapshot boot keeps even the kernel's
# boot id, so that can't tell starts apart). /tmp is open to every app, so whatever is at that name is removed first and
# the note goes in a fresh folder only root can open; if something gets in the way, no note is written.
if ours; then state=on; else state=off; fi
M=/tmp/openlauncher-poweron
rm -rf "$M"
if mkdir -m 700 "$M" 2>/dev/null; then echo "$state" > "$M/loaded"; fi

APPDIR=$(cat "$DIR/appdir" 2>/dev/null)
if [ -z "$APPDIR" ] || [ ! -f "$APPDIR/appinfo.json" ]; then remove; exit 0; fi
if [ "$(sum "$STOCK")" != "$(cat "$DIR/stock.md5" 2>/dev/null)" ]; then remove; exit 0; fi
# the copy is gone (or was replaced by someone else's): nothing left to look after
if ! ours; then rm -f "$SELF"; rm -rf "$DIR"; fi
exit 0
