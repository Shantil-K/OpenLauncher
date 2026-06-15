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
#  luna-send-pub -n 1 'luna://com.webos.service.eim/addDevice' '{"appId":"moe.exkc.hoooooooooom","pigImage":"","mvpdIcon":""}'
 
# cp /media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom/access/replace.sh /var/lib/webosbrew/init.d/

# chmod +x /var/lib/webosbrew/init.d/replace.sh

```

 `access/IMG_5901.JPG` is under CC-BY-SA license
 `access/fallback.png` is proby under Apache License bc it is found in webos oss

 The rest is under  WTFNMFPL.
