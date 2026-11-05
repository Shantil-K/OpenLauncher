#!/bin/sh
# OpenLauncher: keep the TV's web app debugger (port 9998) on the TV itself.
#
# Developer Mode, which a rooted TV keeps on, starts the web app manager with its DevTools on port 9998, open to the whole
# network with no login. Anyone on the network could then run code inside OpenLauncher, which can run commands as root.
# This drops the port on every network interface except the TV's own (loopback). The rule lives in memory, so Homebrew
# Channel runs this at every start (a copy is in /var/lib/webosbrew/init.d) and OpenLauncher runs it again when it opens.
# Developers can still reach the debugger through SSH:  ssh -L 9998:localhost:9998 root@<tv>
# (From Glasshouse's research, github.com/rorygallagher2024/glasshouse, MIT.)
# Some TVs' kernels have no firewall; there the port can't be closed this way.
for t in /usr/sbin/iptables /usr/sbin/ip6tables /sbin/iptables /sbin/ip6tables; do
	[ -x "$t" ] || continue
	"$t" -C INPUT -p tcp --dport 9998 ! -i lo -j DROP 2>/dev/null || "$t" -I INPUT -p tcp --dport 9998 ! -i lo -j DROP 2>/dev/null
done
exit 0
