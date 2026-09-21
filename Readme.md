<p align="center">
  <img src="docs/logo.png" alt="OpenLauncher logo" width="160">
</p>

<h1 align="center">OpenLauncher</h1>

<p align="center">
  <b>A custom home screen for webOS TVs</b><br>
  Live video wallpapers, folders, a settings screen with live previews, and full remote-control support.
</p>

<p align="center">
  <a href="https://github.com/TharaBhaiDoraemon/OpenLauncher/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/TharaBhaiDoraemon/OpenLauncher?include_prereleases&label=release&color=ff2d75"></a>
  <img alt="webOS 6+" src="https://img.shields.io/badge/webOS-6%2B-2f80ed">
  <img alt="Tested on LG C2" src="https://img.shields.io/badge/tested%20on-LG%20C2-ff7a00">
  <a href="./LICENSE"><img alt="License: GPLv3" src="https://img.shields.io/badge/license-GPLv3-blue"></a>
</p>

<p align="center">
  <a href="#features">Features</a> &middot;
  <a href="#compile">Build</a> &middot;
  <a href="#wallpaper">Wallpaper</a> &middot;
  <a href="#settings">Settings</a> &middot;
  <a href="#pinning-hiding-and-reordering-apps">Editing apps</a> &middot;
  <a href="#remote-control-d-pad">Remote control</a> &middot;
  <a href="#credits">Credits</a>
</p>

<p align="center">
  <img src="demo.png" alt="OpenLauncher on an LG C2" width="800">
</p>

# Features

- **A video wallpaper** that plays on the TV's own video decoder: streamed aerial videos, a built-in offline loop, or your own links and photos. A Now playing card lets you seek, **loop** or skip.
- **An app menu with folders**, a bar to jump between them, and the TV's own inputs and tools (HDMI, DisplayPort, AV, Settings, Sharing...) tucked into folders of their own instead of 189 apps in one list.
- **Edit mode**: hide apps, put them in folders, reorder them, **pin one by dragging it onto the bottom bar**, or uninstall it.
- **Clock, date and weather** in 9 places on the screen, as digital, stacked or analog clocks.
- **A settings screen with live previews** of the clock, the bottom bar and the app menu, switches, sliders and icons.
- **Works with the remote**: arrows, OK, Back and the coloured buttons, as well as the Magic Remote pointer.
- **Recent apps**, **OLED protection** (pixel shift and dimming), and **backup** of your settings and layout.

Requires webOS 6 or newer. Tested on an LG C2.

# Credits

This is based on the original **QwQHome** launcher created by **exkc**, originally
hosted at [git.exkc.moe/qvh/moe.exkc.hoooooooooom](https://git.exkc.moe/qvh/moe.exkc.hoooooooooom).

All credit for the original design and implementation goes to exkc.

The list of aerial wallpaper videos (Apple, Amazon and community) comes from
[conreo/couchy-launcher](https://github.com/conreo/couchy-launcher). The videos are streamed from their
original hosts and are not part of this repo.

Weather data is by [Open-Meteo.com](https://open-meteo.com) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

It also depends on [QwQwebosTV.js](https://git.exkc.moe/qvh/QwQwebosTV.js), a
helper library also written by exkc, vendored directly at
`src/js/lib/QwQwebosTV.js/main.js` so a plain clone builds without extra steps.


It requires `"trustLevel": "trusted",` or Webosbrew (with root) to work.

Add `"trustLevel": "trusted",` to appinfo.json if you can run it with  `"trustLevel": "trusted",`.

Side note : usually web os on lg tv wont let developer app's trustLevel to be setted to trusted.

# Compile

Optional: build the offline wallpaper video first (needs ffmpeg, takes a few minutes).
It is the fallback when the streamed aerial videos can't play (see Wallpaper below), and it is
much smoother than rotating 4K JPEGs, which the TV has to decode on the CPU.
Without it the last fallback is rotating the images.

```
$ ./scripts/make-wallpaper-video.sh

```

Video is processed by the TV's picture engine, so it can look grainy in some picture modes.
Use Game (or Filmmaker) picture mode, or turn off noise reduction / Super Resolution.

Run the following command to build it :

```
$ ares-package src

```

# Wallpaper

The background is a video. It plays, in this order:

1. Aerial videos streamed from the internet (`src/js/aerials.js`, shuffled, one after another).
2. The local `loop.mp4` from `./scripts/make-wallpaper-video.sh`, if the network videos can't play.
3. The rotating images, if that can't play either.

Streaming uses roughly 6 Mbps (about 2.7 GB per hour) while the launcher is on screen. Playback
pauses while another app is in front. Dead links are skipped, and after 6 failures in a row it
falls back to the local video.

The **info button** (bottom right of the home screen) opens a "Now playing" card with the video's name and source,
a seekbar you can drag to jump around, **Loop video** and **Skip video**. Loop repeats the video that is playing (with the built-in file, the 20 second wallpaper that is playing) until you turn it off, press Skip or a new video starts; it is not offered for photos. With the built-in loop, Skip jumps to the next wallpaper.
Back closes the card.

In **Settings > Wallpaper** you can switch the **Video source** to *Offline (built in)* to stop streaming and play only the
local `loop.mp4`, to *My own* (below), or back to *Online (streamed)*.

*My own* plays links you add, in random order: videos (`.mp4 .mov .mkv .webm .m4v .ts`) play through, photos
(`.jpg .png .webp .gif .bmp .avif`) stay for 10 s to 1 min (your choice). Use `http://` or `https://` links, or `file://` links /
absolute paths for files on the TV or a USB drive. A link that won't load is skipped, and if the list is empty or keeps failing
the online videos play instead.

To refresh the aerial list:

```
$ cd NetworkVideo
$ python3 main.py       # downloads the list and writes aerials.m3u
$ python3 make_js.py    # converts it to src/js/aerials.js (name, source and url of every video)
```

# Settings

Open the app drawer and press the gear next to **Edit**. Back closes it. Settings are saved and kept between launches.

Each tab has an icon. On/Off settings are switches, sizes are S / M / L / XL, and long lists (clock style, date format) step through with the arrows. The **Clock**, **Date**, **Weather** and **Apps** tabs show a live miniature of your screen beside the settings: the clock, date and weather where they will be, and the bottom bar and app menu at the size you picked. A small **i** next to a setting means it has an explanation; it appears in the strip under the panel while you are on that setting (with nothing selected the strip says "Hover over the info icon next to a setting to view more info").

Picking a position for the clock, date or weather also fades the panel away for about a second and a half so you can see where it went; any button press brings it back.

- **Clock**: digital, stacked, analog, analog minimal or off; seconds on/off; 12/24-hour; and where on screen it goes (3x3 grid).
- **Date**: format (`YYYY/MM/DD`, `DD/MM/YYYY`, `DD Month YYYY`, ...), an optional day of week before or after the date, and where it goes (under the clock or anywhere on screen). Turn Date and Day of week both off to hide it.
- **Weather**: the current temperature and conditions from [Open-Meteo](https://open-meteo.com) (free, needs the internet). Type a city and press Search, then choose °C or °F and where it goes. Refreshed every 15 minutes.
- **Apps**: size of the bottom bar and of the app menu, **System apps** (off by default: the TV marks its inputs, services and helper apps as not meant for an app list, 134 of 189 on an LG C2, and the app menu leaves them out; Live TV, the HDMI inputs and Settings stay on the bottom bar either way), how dark the app menu's **Background** is (a 0 to 100% slider, 50% by default; the clock, date and weather are always hidden while the menu is open), names under the apps and their size (bar and menu separately; the size only shows while names are on), a **Recent apps** row above the bottom bar (off by default), **Folders** (add, rename, delete), and the colour used when hovering an app.
- **Wallpaper**: where the wallpaper comes from: streamed online, built in, or your own links. For the online source, **Video sources** lists where the streamed videos come from and how many there are of each (Apple, Amazon and the community lists, 289 in all).
- **Screen**: protection for OLED TVs, all off by default. **Pixel shift** nudges the clock, bar and buttons a few pixels every minute. **When idle after** 1 to 10 minutes without any input it dims the clock, date, weather, bar and buttons, or hides the bar and dims the rest; any input wakes it. **Dim level** (5 to 100%, 30% by default) sets how bright they stay, and a miniature screen beside it shows the result. The dimming darkens what is drawn instead of making it see-through, so it looks the same over the wallpaper and over the black moment between two videos.
- **Backup**: **Export** your settings and app layout as JSON and **Import** them again. With root the backup is also written to and read from `/media/developer/openlauncher-settings.json` (**Load file**); without root it is shown in a text box.
- **App info**: a system-information page for the launcher: its icon, release and package, when it was last updated, what it runs as (trusted app or root), whether a settings backup is saved (with root it looks for the backup file and shows its date), how many settings you changed and your layout, the wallpaper source, the screen resolution and web engine, the TV's model and firmware, and the GitHub project (address, where to report a problem, licence). **Check for updates** asks GitHub for the newest release; the internet is only used when you press it. **Refresh** looks everything up again.
- **TV**: opens the TV's own settings (`com.palm.app.settings`), and resets the launcher settings to their defaults.

To add a setting, add an item to `SETTINGS_SCHEMA` in `src/js/settings.js` (the panel, defaults and saving are generated from it),
then make `applyprefs()` do something with its `key`. The comment at the top of that file lists the item types.

# Pinning, hiding and reordering apps

Open the app drawer and press **Edit** (bottom right). While editing, launching is off and
hovering an app shows its controls over it:

- **Crossed-out eye / open eye**: hide the app, or show it again. Hidden apps are dimmed while editing and disappear when you press **Done**. Hiding sends the app to the end of the list. Showing it again leaves it where it is until you press **Done**; then it goes before the apps that are still hidden, which makes it the last app in the list.
- **Reorder icon (two arrows)**: hover-only, no clicking. Rest the pointer on it for a little under a second (it fills
  with the hover colour) to pick the app up. Then just move the pointer over other apps in the same drawer or bar and the app takes
  their place, following the pointer. Rest on it for a moment to drop it.
  **This is also how you pin:** carry an app from the app menu over the bottom bar and it is pinned there (in the place of the tile
  you are over, or at the end if you hover the empty part of the bar; a hidden app is shown again). Carry a pinned app back over the app menu
  and it is unpinned. Pinned apps have a ring in the hover colour in the app menu.

- **Inputs, TV, Settings, Sharing, Help folders**: the TV keeps its own apps out of an app list (`visible: false`), but some of them are useful, so the first time they are found they are put in folders of their own: **Inputs** (HDMI 1-4, DisplayPort, AV, AV1/AV2, Component, USB-C), **TV** (Live TV, Guide, Recordings, Scheduler, Programme manager/tuning), **Settings** (TV settings, Software Update, Picture and Sound wizards, Soundbar, Game Optimizer, Notifications...), **Sharing** (Screen Share, AirPlay, Chromecast, Sound Share, Bluetooth audio, Auracast, Remote PC...) and **Help** (User Guide, Tips, Quick Help...). Only apps the TV hides are moved, and only groups with an installed app get a folder. They are normal folders after that: rename them, take an app out (it stays out and goes back to being hidden), or delete one (it stays deleted). **Settings > Apps > Folders > Restore** puts them all back. An app in a folder is always listed. The launcher's own tile is never listed in the app menu; its information is in **Settings > App info**. Everything else the TV hides (overlays, ad and service apps, examples...) stays hidden unless **System apps** is on.
- **Folder icon**: opens "Move <app> to": the app's icon and where it is now at the top, then a card for the **Main list** and one for each folder (a peek at its apps, how many it holds, a tick on the one the app is in). Press a card and the app moves, with a line at the bottom saying so. Under the cards, **New folder** offers one-press names that aren't used yet (Games, Streaming, Media, Tools, Kids...) that make the folder and move the app in one go, or **Type a name** to open a text box (Enter or Create makes it; a name that's blank or already used is explained in the same window). Folders show first in the app menu, each as a small 2x2 peek at the apps inside. The Recent apps row is filled in by itself, so its tiles have no edit controls and can't be reordered. Once you have a folder, a bar at the top of the app menu has **All apps** and one chip per folder with how many apps it holds, so you can jump straight from one folder to another (or back to all apps) without leaving the menu. Back on the remote also leaves a folder. An empty folder tells you how to fill it.
- **Unpin icon (on the bottom bar's tiles only)**: take the app off the bottom bar. (The app menu has no pin buttons; you pin by carrying an app onto the bar.)
- **Pencil icon**: rename the app. A small window shows the app's icon and a text box with its current name; **Enter** or **Save** keeps it, **Use the original name** goes back to the TV's name. The new name is used in the app menu, the bottom bar, the Recent row and the folder window, and is kept in your backup. Only the launcher's label changes, not the app.
- **Trash icon (red on hover)**: uninstall the app. It always asks first ("Uninstall <app>?", with Cancel selected), then asks the TV to remove it through `com.webos.appInstallService` (with root, through the root service). The launcher waits for the app to leave the app list, then forgets its pin, hidden state, place, folder and recent entry. The button is not shown for the launcher itself or for apps the TV reports as not removable (`removable: false`); if the TV refuses, you get a toast and nothing changes.

An app name that is too long for its tile (it ends in "...") slides sideways, back and forth, while you hover the tile or the remote's focus ring is on it, so you can read all of it.

Everything is saved in the app's localStorage and kept between launches.

# Remote control (D-pad)

Everything works with the arrow keys and OK, not only the Magic Remote pointer. The first key press shows a highlight; the
arrows move it to the nearest item in that direction, **OK** activates it, **Back** goes up one level (closes the panel, leaves
a folder, then opens/closes the app menu). Moving the pointer switches back to pointer mode. When the Magic Remote's cursor times out, the item it was on keeps the highlight, and the arrows carry on from there; pressing an arrow while the cursor is still showing starts from the item under it. **Right** from the Edit/Done button wraps round to the **Apps** button.

- **Coloured buttons** are shortcuts: **Yellow** opens/closes Settings, **Red** the info card, **Blue** turns Edit on and off.
- In **Edit mode**, OK on an app opens a small menu: hide/show, move to folder, **Rename...**, **Reorder** (then the arrows move
  the app, and OK or Back drops it; **Down** past the last row of the menu pins it to the bottom bar, **Up** out of the bar unpins it) and **Uninstall...** (asks first; the focus starts on Cancel).
- In a **text box** OK opens the on-screen keyboard; while typing the arrows belong to the box, and Back leaves it.
- On the **seekbar** in the info card, Left/Right jump 2%.

# Auto-start

Run below command on the TV to make it auto start by making it as input :

(For webos6+) (Root Needed) (Optional)

```
# luna-send-pub -n 1 'luna://com.webos.service.eim/addDevice' '{"appId":"com.homebrew.openlauncher","pigImage":"access/wallpaper/IMG_20211017_181128.jpg","mvpdIcon":"access/wallpaper/IMG_20211017_181128.jpg","description": "OpenLauncher :3"}'

```
# Post-Insatll setup for Webos 26

If you update/install this app in webos then u would need to run this command and reboot.

(See https://github.com/webosbrew/webos-homebrew-channel/pull/233/changes/caca830efab9f34245cc586746b6acd5ba6fd351)


```
# echo '{"com.homebrew.openlauncher-*":["public"]}'  > /var/luna-service2-dev/client-permissions.d/com.homebrew.openlauncher.app.json 

```

# Replace

If you want it to replace your stock home screen then see [here](./src/access/replace).

# License

 `src/access/wallpaper/*` are under CC-BY-SA license
 `src/access/fallback.png` is proby under Apache License bc it is from in webos oss
 `src/js/icons.js` contains Material Symbols icons by Google under the Apache License 2.0
 `src/access/plusjakartasans-bold.woff2` is Plus Jakarta Sans Bold, generated from the variable font under the SIL Open Font License (see `src/access/OFL-PlusJakartaSans.txt`)
 `src/access/appbar.svg` is proby under Apache License bc it is from in https://fonts.google.com/
 `src/js/lib/QwQwebosTV.js/main.js` is under the WTFNMFPL license (see its SPDX header)

The rest is under the GNU General Public License v3.0 (GPLv3), see [LICENSE](./LICENSE).
