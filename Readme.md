<p align="center">
  <img src="docs/logo.png" alt="OpenLauncher logo" width="160">
</p>

<h1 align="center">OpenLauncher</h1>

<p align="center">
  <b>A custom home screen for webOS TVs</b><br>
  Live video wallpapers, folders, a settings screen with live previews, and full remote-control support.
</p>

<p align="center">
  <a href="https://github.com/Shantil-K/OpenLauncher/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/Shantil-K/OpenLauncher?include_prereleases&label=release&color=ff2d75"></a>
  <img alt="webOS 6+" src="https://img.shields.io/badge/webOS-6%2B-2f80ed">
  <img alt="Tested on LG C2" src="https://img.shields.io/badge/tested%20on-LG%20C2-ff7a00">
  <a href="./LICENSE"><img alt="License: GPLv3" src="https://img.shields.io/badge/license-GPLv3-blue"></a>
</p>

<p align="center">
  <a href="https://github.com/Shantil-K/OpenLauncher/releases/download/v1.0.1/OpenLauncher-demo.mp4">
    <img src="docs/demo.webp" alt="OpenLauncher demo: video wallpaper, folders, remote control, settings and self-update" width="800">
  </a><br>
  <a href="https://github.com/Shantil-K/OpenLauncher/releases/download/v1.0.1/OpenLauncher-demo.mp4"><b>▶ Watch the full demo (1:46)</b></a>
</p>

# Features

- **Wallpaper**: streamed aerial videos (Apple, Amazon, community) on the TV's hardware decoder, or **My wallpapers**: built-in photos, your own pictures, videos and whole folders from a USB stick or the TV's storage, or links. One stays put; several take turns.
- **App menu with folders**. HDMI inputs, TV settings, sharing and other system apps are sorted into folders of their own.
- **Edit mode**: hide, reorder, move to folders, pin to the bottom bar or uninstall apps.
- **Your own names and icons** (Settings > Apps > Names and icons), with icons from a USB stick or the TV's storage.
- **Running apps**: see what the TV keeps open in the background and close one or all of them (green button).
- **Clock, date and weather** anywhere on screen, in digital, stacked or analog styles.
- **Settings with live previews**, OLED protection (pixel shift, idle dimming), recent apps, and backup/restore.
- **Full remote support**: arrows, OK, Back, coloured buttons and the Magic Remote pointer.
- **Replace the stock Home screen**, **start the TV straight into OpenLauncher**, and **update from GitHub** right from the app (root).
- **Fast start**: the home screen is drawn from the app list saved last time, then refreshed in the background.

Requires webOS 6 or newer. Tested on an LG C2.

# Install

1. Download the `.ipk` from [Releases](https://github.com/Shantil-K/OpenLauncher/releases).
2. Install it with [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop) or `ares-install`.

It needs a rooted TV with [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel), or `"trustLevel": "trusted"` in `appinfo.json` (developer-mode TVs usually don't allow that).

Everything else is set up inside the app. To make it your Home screen, open **Settings > TV > Replace stock Home** and press **Apply**. To have the TV open it when you switch it on, choose **OpenLauncher** under **Settings > TV > When the TV turns on** (works from the next full restart). Before uninstalling, press **Restore stock Home**, or use **Settings > App info > Uninstall OpenLauncher**, which undoes both.

Your own wallpapers and icons: put pictures and videos on a USB stick or in `/media/developer/wallpapers` (copy them over SSH or with Dev Manager's file manager).

Without root, nothing can replace LG's Home: use the TV's Quick Access (hold a number key while OpenLauncher is open), or run [`tools/home-watch`](tools/home-watch) on another device that stays on.

# Remote shortcuts

- **Yellow**: Settings · **Red**: Now playing card · **Green**: Running apps · **Blue**: Edit mode
- **Back** goes up one level. In Edit mode, **OK** on an app opens its menu.

Tip: if the video wallpaper looks grainy, use Game or Filmmaker picture mode, or turn off noise reduction.

# Build

```
$ ares-package src
```

To refresh the aerial video list, run `python3 main.py` and then `python3 make_js.py` inside `NetworkVideo/`.

# Security

OpenLauncher can run commands as root on a rooted TV, so it is built to keep that power to itself:

- **Signed updates.** The in-app updater only installs a release whose `.ipk` is signed with the maintainer's key, which
  never leaves the maintainer's computer. The TV checks the signature (and GitHub's checksum) before installing, over
  HTTPS only. A release is also built with [GitHub build provenance](https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations),
  which is checked before it is signed. To check a download yourself:
  `openssl dgst -sha256 -verify key.pem -signature com.homebrew.openlauncher_X_all.ipk.sig com.homebrew.openlauncher_X_all.ipk`
  with the public key from `src/js/update.js`.
- **No outside scripts.** A Content Security Policy lets only the launcher's own script files run, so an app name, a file
  name, a backup or a web answer can never run code. Everything sent to the root shell is quoted.
- **Root files in root-only places.** Anything that runs as root at start-up, or is mounted into the system, lives in
  `/var/lib/webosbrew`, never in `/media/developer` or `/tmp`, where any app on the TV can write.

Found a problem? Please open an issue, or for anything serious, contact the maintainer privately first.

# Credits

- Based on **QwQHome** by **exkc** ([git.exkc.moe/qvh/moe.exkc.hoooooooooom](https://git.exkc.moe/qvh/moe.exkc.hoooooooooom)). All credit for the original design and implementation goes to exkc.
- Uses [QwQwebosTV.js](https://git.exkc.moe/qvh/QwQwebosTV.js), also by exkc, vendored in `src/js/lib/QwQwebosTV.js/`.
- Aerial video list from [conreo/couchy-launcher](https://github.com/conreo/couchy-launcher). The videos are streamed from their original hosts.
- Starting the TV into the launcher uses the method of [Hearth](https://github.com/rudra-avatar/Hearth) by rudra-avatar (MIT), which also inspired custom icons, running apps and the USB wallpapers.
- `tools/home-watch` is adapted from [webos-vibehack](https://github.com/OmkarK97/webos-vibehack) by Gathin and OmkarK97 (MIT, see [its license](tools/home-watch/LICENSE)).
- Weather by [Open-Meteo.com](https://open-meteo.com) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

# License

GPLv3 (see [LICENSE](./LICENSE)), except:

- `src/access/wallpaper/*`: CC-BY-SA
- `src/access/fallback.png`, `src/access/appbar.svg`: probably Apache 2.0 (from webOS OSS and Google Fonts)
- `src/js/icons.js`: Material Symbols by Google, Apache 2.0
- `src/access/plusjakartasans-bold.woff2`: Plus Jakarta Sans, SIL Open Font License (see `src/access/OFL-PlusJakartaSans.txt`)
- `src/js/lib/QwQwebosTV.js/main.js`: WTFNMFPL (see its SPDX header)
- `tools/home-watch/home-watch.py`, `tools/home-watch/lgtv.py`: MIT (see `tools/home-watch/LICENSE`)
