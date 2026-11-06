# Simulator

Runs OpenLauncher (`src/`) in Chrome on a computer, looking and working the same as on the TV, for recording demos and
trying changes without installing. It is the real launcher; this folder only stands in for the TV around it:

- **The TV's services** (`mock.js`): the app list, running apps, inputs, the 12/24-hour setting, launching (a small note
  says which app would open), and harmless answers for the root shell. Nothing on the computer is changed.
- **Your TV's data**: `snapshot.sh` copies the app list, app icons, inputs, running apps and OpenLauncher's saved settings
  (your layout, wallpapers, look) from a rooted TV, so it looks like yours. It stays in `snapshot/`, which is never
  committed. Without one, a few sample apps are used.
- **The remote**: arrows move, **Enter** is OK, **Esc** or **Backspace** is Back, **1 2 3 4** are the red, green, yellow
  and blue buttons.
- **The pointer**: OpenLauncher's own (`pointer.svg`, original artwork drawn from plain shapes, not LG's): it turns the
  accent colour while pressed and pops in and out as it appears and hides. It is drawn in the page itself, so recordings
  show it. The arrow keys hide it and moving the mouse brings it back, as on the TV.

## Use

```
tools/simulator/snapshot.sh 192.168.0.201   # once, or whenever the TV changes (SSH as root, Node.js 22+)
tools/simulator/run.sh                      # full screen; Alt+F4 quits
WINDOW=1 tools/simulator/run.sh             # a 1920x1080 window
HEADLESS=1 tools/simulator/run.sh           # no window, DevTools protocol on port 9333 (scripted recordings)
tools/simulator/record.sh                   # opens it full screen and records until Ctrl+C, into ~/Videos
tools/simulator/dev.sh                      # live: serves src/ as it is; save a file and the window follows
```

`dev.sh` is for working on the launcher: it serves `src/` straight from the repository (with `serve.mjs`, on this
computer only) and the page reloads when a file changes, or just swaps the stylesheet when only CSS changed.

For a screen that isn't 16:9 (a tablet), open `sim/frame.html`: it shows the launcher in an exact 1920x1080 frame,
scaled to fit.

`record.sh` keeps the computer's load low so the recording doesn't stutter: the wallpaper uses only the 2K videos
(`LIGHTVIDEO=1`), Chrome decodes video on the graphics chip where it can, and the screen is encoded by the graphics card
(NVIDIA NVENC or Intel VA-API) when there is one. It leaves the computer's own cursor out. Any other screen recorder works
too; hide its cursor, since the simulator draws the TV's. Settings you change in the simulator are kept in
`build/profile`; delete that folder to start again from the snapshot.

The snapshot holds your settings and the app makers' icons: it stays on your computer and is never committed.

What isn't the TV: apps don't really open, nothing is uninstalled or installed, and USB sticks and the TV's storage aren't
there. The video wallpapers stream as on the TV; they need Google Chrome (not Chromium) for H.264.
