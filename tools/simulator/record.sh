#!/bin/sh
# Records the simulator full screen, for previews: opens it (run.sh), records the screen at 30 fps until you press Ctrl+C
# (or for SECONDS seconds), then closes it. The pointer is the one drawn in the page; the computer's own cursor is left out.
#   tools/simulator/record.sh                  record until Ctrl+C, into ~/Videos/openlauncher-<time>.mp4
#   SECONDS_LIMIT=60 tools/simulator/record.sh
# Light on the CPU: the wallpaper uses only the 2K videos, Chrome decodes video on the graphics chip where it can, and the
# recording is encoded by the graphics card (NVIDIA NVENC or Intel VA-API) when there is one. Needs ffmpeg and an X11 desktop.
set -eu
cd "$(dirname "$0")"
OUT="${OUT:-$HOME/Videos/openlauncher-$(date +%Y%m%d-%H%M%S).mp4}"
mkdir -p "$(dirname "$OUT")"
SIZE=$(xdpyinfo 2>/dev/null | awk '/dimensions:/{print $2; exit}')
SIZE=${SIZE:-1920x1080}

LIGHTVIDEO=1 ./run.sh >/dev/null 2>&1 &
CHROME=$!
echo "Opening the simulator..."
sleep 6

# the encoder: the graphics card if it can, else the CPU at its lightest setting
if ffmpeg -v error -f lavfi -i nullsrc=s=256x256 -t 0.1 -c:v h264_nvenc -f null - 2>/dev/null; then
	ENC="-c:v h264_nvenc -preset p5 -cq 22 -pix_fmt yuv420p"
elif ffmpeg -v error -vaapi_device /dev/dri/renderD128 -f lavfi -i nullsrc=s=256x256 -t 0.1 -vf format=nv12,hwupload -c:v h264_vaapi -f null - 2>/dev/null; then
	ENC="-vaapi_device /dev/dri/renderD128 -vf format=nv12,hwupload -c:v h264_vaapi -qp 22"
else
	ENC="-c:v libx264 -preset ultrafast -crf 20 -pix_fmt yuv420p"
fi
LIMIT=""
[ -n "${SECONDS_LIMIT:-}" ] && LIMIT="-t $SECONDS_LIMIT"
echo "Recording to $OUT (Ctrl+C to stop)"
# Ctrl+C stops the recording (ffmpeg finishes the file); this script carries on to close the simulator
trap ':' INT
# shellcheck disable=SC2086
ffmpeg -v error -y -f x11grab -framerate 30 -video_size "$SIZE" -draw_mouse 0 $LIMIT -i "${DISPLAY:-:0}.0+0,0" $ENC -movflags +faststart "$OUT" || true
kill "$CHROME" 2>/dev/null || true
pkill -f "simulator/buil[d]/profile" 2>/dev/null || true
echo "Saved $OUT"
