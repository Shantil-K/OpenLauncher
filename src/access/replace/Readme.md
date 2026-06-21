There are way method for doing do so :


`copilot.sh` (For webos 25) : In webos 25 there are a new copilot app that launch the web browser to the copilot site.I used the patched copilot to making it to launch the custom home screen and used that patched copilot 's libapp.so to replace the home flutter libapp.so

`keyfilters-6-23.sh` (For webos 23) : In webos keyfilters are used for keybinding.That script patched the hard coded home screen package id in one of the keyfilters hence it bascilly remapped your home key to launch this custom home screen.Starting webos 25(or 24?) the home screen id is no longer hard coded therefore it only work in webos 6-23.(maybe it will work in webos 24).

Run the fellow command on the TV to replace your home screen :

(Root Needed) (Optional)

```
# cp /media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom/access/replace/method.sh /var/lib/webosbrew/init.d/

# chmod +x /var/lib/webosbrew/init.d/replace.sh

```

