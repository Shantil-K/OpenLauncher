#!/bin/sh
# SPDX-License-Identifier: WTFNMFPL

cd /tmp/

sed 's|com.webos.app.browser|com.homebrew.openlauncher|g' /usr/palm/applications/com.webos.app.quicklinkcopilot/lib/libapp.so > libapp.so

mount --rbind ./libapp.so /usr/palm/applications/com.webos.app.home/lib/libapp.so

if pgrep -la flutter-client | grep 'com.webos.app.home'
then
pgrep -la flutter-client | grep 'com.webos.app.home' | awk '{print $1}' | while read A ; do kill -9 $A ; done
fi

