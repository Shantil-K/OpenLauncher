#!/bin/sh
# SPDX-License-Identifier: WTFNMFPL

# The patched library is kept in a folder only root can write to: it is loaded by the system's Home app, so a copy in /tmp
# (which any app can write to) could be swapped for something else.
D=/var/lib/webosbrew/openlauncher
mkdir -p "$D" && chmod 700 "$D" || exit 1
rm -f "$D/libapp.so"
sed 's|com.webos.app.browser|com.homebrew.openlauncher|g' /usr/palm/applications/com.webos.app.quicklinkcopilot/lib/libapp.so > "$D/libapp.so" || exit 1

mount --rbind "$D/libapp.so" /usr/palm/applications/com.webos.app.home/lib/libapp.so

if pgrep -la flutter-client | grep 'com.webos.app.home'
then
pgrep -la flutter-client | grep 'com.webos.app.home' | awk '{print $1}' | while read A ; do kill -9 $A ; done
fi

