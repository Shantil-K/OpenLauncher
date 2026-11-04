#!/bin/sh
# The patched key filter is kept in a folder only root can write to: it is mounted into the system UI, so a copy in /tmp
# (which any app can write to) could be swapped for something else before or after the mount.
D=/var/lib/webosbrew/openlauncher
mkdir -p "$D" && chmod 700 "$D" || exit 1
rm -f "$D/hackfilters.js"
sed 's|com.webos.app.home|com.homebrew.openlauncher|g' /usr/lib/qml/KeyFilters/systemUi.js > "$D/hackfilters.js" || exit 1
mount --rbind "$D/hackfilters.js" /usr/lib/qml/KeyFilters/systemUi.js
restart sam
