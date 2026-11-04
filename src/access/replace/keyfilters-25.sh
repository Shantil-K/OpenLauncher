#!/bin/sh
# The patched key filter is kept in a folder only root can write to (see keyfilters-6-24.sh).
D=/var/lib/webosbrew/openlauncher
mkdir -p "$D" && chmod 700 "$D" || exit 1
rm -f "$D/hackfilters.js"
sed 's|applicationManager.launchDefaultApp(JSON.stringify({"category": "home"|applicationManager.launch("com.homebrew.openlauncher","{}");//applicationManager.launchDefaultApp(JSON.stringify({"category": "home"|g' /usr/lib/qml/KeyFilters/systemUi.js > "$D/hackfilters.js" || exit 1
mount --rbind "$D/hackfilters.js" /usr/lib/qml/KeyFilters/systemUi.js
restart sam
