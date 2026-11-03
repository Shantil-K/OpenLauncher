#!/bin/sh
# Sets OpenLauncher's version in both places that carry it: src/appinfo.json (what the TV,
# Dev Manager and other updaters read) and APP_RELEASE in src/js/about.js (the in-app updater).
# The release tag must then be v<version>; the release workflow refuses to publish otherwise.
# Usage: scripts/set-version.sh 2.0.2
set -e
cd "$(dirname "$0")/.."
V="${1#v}"
echo "$V" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$' || { echo "usage: $0 X.Y.Z[-suffix]" >&2; exit 1; }
sed -i -E 's/("version"[[:space:]]*:[[:space:]]*")[^"]*"/\1'"$V"'"/' src/appinfo.json
sed -i -E 's/^const APP_RELEASE="[^"]*";/const APP_RELEASE="'"$V"'";/' src/js/about.js
grep -n '"version"' src/appinfo.json
grep -n '^const APP_RELEASE' src/js/about.js
echo "now commit, then: git tag -a v$V -m \"OpenLauncher v$V\" && git push origin v$V"
