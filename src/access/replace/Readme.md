There are way method for doing do so :

`copilot-25-26.sh` (For webos 25-26) : In webos 25 there are a new copilot app that launch the web browser to the copilot site.I used the patched copilot to making it to launch the custom home screen and used that patched copilot 's libapp.so to replace the home flutter libapp.so

`keyfilters-6-24.sh` (For webos 6-24) : In webos keyfilters are used for keybinding.That script patched the hard coded home screen package id in one of the keyfilters hence it bascilly remapped your home key to launch this custom home screen.Starting webos 25 the home screen id is no longer hard coded therefore it only work in webos 6-24.

`keyfilters-25.sh` (For webos 25) : In webos 25, the home screen package is no longer hardcoded.It seem now it use launchDefaultApp to launch home. that luna call seem to be launching default home from settings in applications manager so the script patched that keyfiller to launch this custom home via hardcoding.

`appstub-6-25.sh` (For webos 6-25) : In seem restarting sam would make webos rescran all the system app 's appinfo.json therefore it is possiable to replace the stock home with a simple webapp that only open this home and the script is for doing just that. 

`appdefault-25-26.sh` (For webos 25-26) : In webos 25-26, the home screen package is no longer hardcoded.It seem now it use launchDefaultApp to launch home. This script set this home as DefaultApp of home.

Run the fellow command on the TV to replace your home screen (expect for `appdefault-25-26.sh`) :

(Root Needed) (Optional)

```
# cp /media/developer/apps/usr/palm/applications/com.homebrew.openlauncher/access/replace/method.sh /var/lib/webosbrew/init.d/

# chmod +x /var/lib/webosbrew/init.d/replace.sh

```

For `appdefault-25-26.sh` :

```
# /media/developer/apps/usr/palm/applications/com.homebrew.openlauncher/access/replace/appdefault-25-26.sh

```
