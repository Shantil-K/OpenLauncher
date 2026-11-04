# Home button without root

On a TV that isn't rooted, nothing can replace LG's Home screen: webOS closes a normal app when another app opens, won't
tell an app which app is in front, and ends background services after a few seconds. So this watcher runs on **another
device that stays on** (a Raspberry Pi, a home server, any Linux or Mac machine on the same network). It watches the TV's
foreground app over LG's remote-control connection, the one LG's phone app uses, and the moment LG's Home appears it
opens OpenLauncher on top. LG's Home shows for about half a second.

- Press **Home twice** within three seconds to stay on LG's Home (for its menus).
- When the watcher isn't running, Home opens LG's Home as usual.

Not tested with OpenLauncher on a TV yet. On a rooted TV use **Settings > TV > Replace stock Home** instead: it is faster
and needs no second device.

## Setup

1. On the TV turn on **LG Connect Apps** (Network > LG Connect Apps; on newer TVs All Settings > Connection > Mobile
   Connection Management).
2. On the always-on machine:

   ```
   git clone https://github.com/Shantil-K/OpenLauncher.git
   cd OpenLauncher/tools/home-watch
   TV_HOST=192.168.1.50 ./install-linux.sh
   ```

   Use your TV's address. The first run shows an "allow this device?" prompt on the TV: accept it. The key is kept in
   `.lgtv-key.json` next to the script.

To try it without installing: `python3 -m venv venv && venv/bin/pip install websockets && venv/bin/python home-watch.py 192.168.1.50`.

To remove it: `./install-linux.sh uninstall`.

## Credits

`home-watch.py` and `lgtv.py` are adapted from [webos-vibehack](https://github.com/OmkarK97/webos-vibehack) by Gathin and
OmkarK97, MIT License (see [LICENSE](LICENSE)).
