# Replacing LG's Home screen

These scripts make the remote's **Home** button open OpenLauncher. OpenLauncher runs them itself from
**Settings > TV > Replace stock Home** (root needed), and **Restore stock Home** undoes all of them, so you normally
never run them by hand.

| Script | webOS | What it does |
| --- | --- | --- |
| `keyfilters-6-24.sh` | 6 to 24 | The system UI's key filter (`/usr/lib/qml/KeyFilters/systemUi.js`) names LG's Home app. A copy with OpenLauncher's id in its place is mounted over it. |
| `keyfilters-25.sh` | 25 | The key filter asks for the "default home app" instead. A copy that opens OpenLauncher directly is mounted over it. |
| `appdefault-25-26.sh` | 25 and 26 | Sets OpenLauncher as the system's default Home app. Nothing is mounted. |
| `copilot-25-26.sh` | 25 and 26 | LG's Copilot app opens a link in the browser; a copy of its library that opens OpenLauncher instead is mounted over LG Home's. |

The patched copies are kept in `/var/lib/webosbrew/openlauncher`, which only root can write to. They are mounted into the
system, so they must never sit in `/tmp` or `/media/developer`, where any app on the TV can write. A mount doesn't survive
a restart, so for the mounting methods OpenLauncher copies the script into Homebrew Channel's start-up folder
(`/var/lib/webosbrew/init.d/replace.sh`), which runs it again at every start.

To undo it by hand over SSH:

```
rm -f /var/lib/webosbrew/init.d/replace.sh
umount /usr/lib/qml/KeyFilters/systemUi.js /usr/palm/applications/com.webos.app.home/lib/libapp.so 2>/dev/null
luna-send -n 1 'luna://com.webos.service.applicationmanager/setDefaultApp' '{"category":"home","appId":"com.webos.app.home"}'
restart sam
```
