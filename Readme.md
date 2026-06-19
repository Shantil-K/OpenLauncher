A shitty custom home screen for webos 25

It requited `"trustLevel": "trusted",` or webos brew (with root) to work.

Add `"trustLevel": "trusted", to `appinfo.json

If you can run it with  `"trustLevel": "trusted",`.

Run the fellow command to  build it

```
$ ares-package  .


```

Run the fellow command on the TV to replace your home screen 

(For webos25) (Root Needed) (Optional)


```
# luna-send-pub -n 1 'luna://com.webos.service.eim/addDevice' '{"appId":"moe.exkc.hoooooooooom","pigImage":"access/IMG_5901.JPG","mvpdIcon":"access/IMG_5901.JPG","description": "QwQHome :3",}'
 
# cp /media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom/access/replace.sh /var/lib/webosbrew/init.d/

# chmod +x /var/lib/webosbrew/init.d/replace.sh

```

 `access/IMG_5901.JPG` is under CC-BY-SA license
 `access/fallback.png` is proby under Apache License bc it is from in webos oss
 `access/plusjakartasans.woff2` is under  SIL Open Font License
 `access/appbar.svg` is proby under Apache License bc it is from in https://fonts.google.com/
 
 The rest is under  WTFNMFPL.
