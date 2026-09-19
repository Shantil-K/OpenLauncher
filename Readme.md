A Custom Home screen for Webos 6+

![Demo](demo.png)

Tested on LG C2

# Credits

This is based on the original **QwQHome** launcher created by **exkc**, originally
hosted at [git.exkc.moe/qvh/moe.exkc.hoooooooooom](https://git.exkc.moe/qvh/moe.exkc.hoooooooooom).

All credit for the original design and implementation goes to exkc.

It also depends on [QwQwebosTV.js](https://git.exkc.moe/qvh/QwQwebosTV.js), a
helper library also written by exkc, vendored directly at
`src/js/lib/QwQwebosTV.js/main.js` so a plain clone builds without extra steps.


It requires `"trustLevel": "trusted",` or Webosbrew (with root) to work.

Add `"trustLevel": "trusted",` to appinfo.json if you can run it with  `"trustLevel": "trusted",`.

Side note : usually web os on lg tv wont let developer app's trustLevel to be setted to trusted.

# Compile

Optional but recommended: build the wallpaper video first (needs ffmpeg, takes a few minutes).
The TV decodes video in hardware, which is much smoother than rotating 4K JPEGs on the CPU.
Without it the app falls back to rotating the images.

```
$ ./scripts/make-wallpaper-video.sh

```

Video is processed by the TV's picture engine, so it can look grainy in some picture modes.
Use Game (or Filmmaker) picture mode, or turn off noise reduction / Super Resolution.

Run the following command to build it :

```
$ ares-package src

```

# Pinning and hiding apps

Open the app drawer and press **Edit** (bottom right). Each app then shows **Pin/Unpin**
(bar at the bottom) and **Hide/Show** (drawer). Hidden apps stay dimmed while editing and
disappear when you press **Done**. Settings are stored in the app's localStorage and are
kept between launches.
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
 `src/access/plusjakartasans.woff2` is under SIL Open Font License
 `src/access/appbar.svg` is proby under Apache License bc it is from in https://fonts.google.com/
 `src/js/lib/QwQwebosTV.js/main.js` is under the WTFNMFPL license (see its SPDX header)

The rest is under the GNU General Public License v3.0 (GPLv3), see [LICENSE](./LICENSE).
