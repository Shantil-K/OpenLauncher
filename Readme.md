A Custom Home screen for Webos 6+

![Demo](demo.png)

Tested on LG C2

# Credits

This is based on the original **QwQHome** launcher created by **exkc**, originally
hosted at [git.exkc.moe/qvh/moe.exkc.hoooooooooom](https://git.exkc.moe/qvh/moe.exkc.hoooooooooom).

All credit for the original design and implementation goes to exkc.

The list of aerial wallpaper videos (Apple, Amazon and community) comes from
[conreo/couchy-launcher](https://github.com/conreo/couchy-launcher). The videos are streamed from their
original hosts and are not part of this repo.

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
a seekbar you can drag to jump around, and **Skip video**. With the built-in loop, Skip jumps to the next wallpaper.
Back closes the card.

In **Settings > Wallpaper** you can switch the **Video source** to *Offline (built in)* to stop streaming and play only the
local `loop.mp4`, or back to *Online (streamed)*.

To refresh the aerial list:

```
$ cd NetworkVideo
$ python3 main.py       # downloads the list and writes aerials.m3u
$ python3 make_js.py    # converts it to src/js/aerials.js (name, source and url of every video)
```

# Settings

Open the app drawer and press the gear next to **Edit**. Back closes it. Settings are saved and kept between launches.

- **Clock**: digital, stacked, analog, analog minimal or off; seconds on/off; 12/24-hour; and where on screen it goes (3x3 grid).
- **Date**: format (`YYYY/MM/DD`, `DD/MM/YYYY`, `DD Month YYYY`, ...), an optional day of week before or after the date, and where it goes (under the clock or anywhere on screen). Turn Date and Day of week both off to hide it.
- **Apps**: size of the bottom bar and of the app menu, names under the apps and their size (bar and menu separately; the size only shows while names are on), and the colour used when hovering an app.
- **Wallpaper**: where the wallpaper video comes from (streamed online or built in).
- **TV**: opens the TV's own settings (`com.palm.app.settings`), and resets the launcher settings to their defaults.

To add a setting, add an item to `SETTINGS_SCHEMA` in `src/js/settings.js` (the panel, defaults and saving are generated from it),
then make `applyprefs()` do something with its `key`. The comment at the top of that file lists the item types.

# Pinning, hiding and reordering apps

Open the app drawer and press **Edit** (bottom right). While editing, launching is off and
hovering an app shows its controls over it:

- **Pin icon / slashed pin**: put the app on the bottom bar, or take it off (pinned apps have a ring in the hover colour in the drawer).
- **Crossed-out eye / open eye**: hide the app, or show it again. Hidden apps are dimmed while editing and disappear when you press **Done**.
- **Reorder icon (two arrows)**: hover-only, no clicking. Rest the pointer on it for a little under a second (it fills
  with the hover colour) to pick the app up. Then just move the pointer over other apps in the same drawer or bar and the app takes
  their place, following the pointer. Rest on it for a moment to drop it.

Everything is saved in the app's localStorage and kept between launches.

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
