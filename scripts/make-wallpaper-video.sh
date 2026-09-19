#!/usr/bin/env bash
# SPDX-License-Identifier: WTFNMFPL
# Builds src/access/wallpaper/loop.mp4: every wallpaper as a still shown for SECS seconds
# (shuffled), 4K H.264, so the TV plays it with its hardware video decoder instead of
# decoding big JPEGs on the CPU. Needs ffmpeg. Run it before `ares-package src`.
set -euo pipefail
cd "$(dirname "$0")/.."

SECS="${SECS:-20}"
CRF="${CRF:-17}"
FPS=25
FRAMES=$((SECS * FPS))
DIR=src/access/wallpaper
OUT="$DIR/loop.mp4"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
: > "$TMP/list.txt"

i=0
while read -r img; do
	echo "[$((i + 1))] $img"
	# loop=... repeats one decoded frame; -loop 1 would re-decode the file for every frame
	ffmpeg -nostdin -v error -y -i "$img" \
		-vf "scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,format=yuv420p,loop=loop=$((FRAMES - 1)):size=1:start=0,setpts=N/($FPS*TB)" \
		-frames:v "$FRAMES" -r "$FPS" -an \
		-c:v libx264 -preset veryfast -crf "$CRF" -profile:v high -level 5.1 \
		-x264-params "keyint=$FRAMES:min-keyint=$FRAMES:scenecut=0" \
		-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
		"$TMP/seg$i.mp4"
	echo "file '$TMP/seg$i.mp4'" >> "$TMP/list.txt"
	i=$((i + 1))
done < <(find "$DIR" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.png' \) | shuf)

ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$TMP/list.txt" -c copy -movflags +faststart "$OUT"
echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
