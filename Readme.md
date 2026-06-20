A shitty/hacky custom home screen for webos 6+

![Demo](demo.png)


It requited `"trustLevel": "trusted",` or webosbrew (with root) to work.

Add `"trustLevel": "trusted",` to appinfo.json if you can run it with  `"trustLevel": "trusted",`.

Side note : useually web os on lg tv wont let developer app's trustLevel to be setted to trusted.

# Compile

Run the fellow command to build it :

```
$ ares-package src

```
# Auto-start

Run the fellow command on the TV to make it auto start by making it as input :

(For webos6+) (Root Needed) (Optional)

```
# luna-send-pub -n 1 'luna://com.webos.service.eim/addDevice' '{"appId":"moe.exkc.hoooooooooom","pigImage":"access/wallpaper/IMG_20211017_181128.jpg","mvpdIcon":"access/wallpaper/IMG_20211017_181128.jpg","description": "QwQHome :3"}'

```

# Replace
Run the fellow command on the TV to replace your home screen :

(Root Needed) (Optional)

```
# cp /media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom/access/src/access/replace/your_webos_version.sh /var/lib/webosbrew/init.d/

# chmod +x /var/lib/webosbrew/init.d/replace.sh

```

# License

 `src/access/wallpaper/*` are under CC-BY-SA license
 `src/access/fallback.png` is proby under Apache License bc it is from in webos oss
 `src/access/plusjakartasans.woff2` is under SIL Open Font License
 `src/access/appbar.svg` is proby under Apache License bc it is from in https://fonts.google.com/

The rest is under  WTFNMFPL.
