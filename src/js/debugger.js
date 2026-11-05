//SPDX-License-Identifier: WTFNMFPL
// Settings > TV > Web debugger: keep the TV's web app debugger (port 9998) off the network (rooted TVs).
//
// Developer Mode opens the web app manager's DevTools on port 9998 to anyone on the network, with no login, and a rooted TV
// keeps Developer Mode on. Through it anyone on the network could run code inside OpenLauncher, which can run commands as
// root. So by default a firewall rule drops the port everywhere but on the TV itself: access/debugger/close-debugger.sh,
// copied into Homebrew Channel's start-up folder so it is in place from every start, and run again whenever the launcher
// opens. Choosing "Whole network" takes both away (for developers using ares-inspect without an SSH tunnel).
// The finding and the firewall approach come from Glasshouse (github.com/rorygallagher2024/glasshouse, MIT).

const DEBUGGER_HOOK="/var/lib/webosbrew/init.d/40-openlauncher-debugger";
const DEBUGGER_RULE="INPUT -p tcp --dport 9998 ! -i lo -j DROP";
const DEBUGGER_TOOLS="/usr/sbin/iptables /usr/sbin/ip6tables /sbin/iptables /sbin/ip6tables";
// takes the rule out (as often as it was added) and the start-up hook with it; also run by selfuninstall()
const DEBUGGER_OPEN_COMMAND="rm -f '"+DEBUGGER_HOOK+"'; for t in "+DEBUGGER_TOOLS+"; do [ -x \"$t\" ] || continue; while \"$t\" -D "+DEBUGGER_RULE+" 2>/dev/null; do :; done; done; true";
const DEBUGGER_STATUS_COMMAND="if /usr/sbin/iptables -C "+DEBUGGER_RULE+" 2>/dev/null || /sbin/iptables -C "+DEBUGGER_RULE+" 2>/dev/null; then echo closed; "+
	"elif [ -e /proc/net/ip_tables_names ]; then echo open; else echo unsupported; fi";

let debuggerstate=null;      // null (not checked), "closed", "open" or "unsupported"
let debuggerapplied=null;    // the setting last put in place, so it runs once per change

async function applydebugger(){
	if(!rooted || debuggerapplied===prefs.debuggerOpen){ return; }
	debuggerapplied=prefs.debuggerOpen;
	try {
		if(prefs.debuggerOpen){
			await execasroot(DEBUGGER_OPEN_COMMAND);
		} else {
			// the hook is copied (not linked) into the root-only start-up folder; the app's own folder is writable by others
			const script=await execasroot("cat "+shellquote(appdir+"/access/debugger/close-debugger.sh"));
			const text=String((script && script.stdoutString) || "");
			if(text.indexOf("#!/bin/sh")===0){
				await execasroot("rm -f '"+DEBUGGER_HOOK+".new' && echo "+btoa(text)+" | base64 -d > '"+DEBUGGER_HOOK+".new' && chmod 755 '"+DEBUGGER_HOOK+".new' && mv -f '"+DEBUGGER_HOOK+".new' '"+DEBUGGER_HOOK+"' && sh '"+DEBUGGER_HOOK+"'");
			}
		}
		const result=await execasroot(DEBUGGER_STATUS_COMMAND);
		debuggerstate=String((result && result.stdoutString) || "").trim() || null;
	} catch(e) {
		debuggerstate=null;
	}
	if(typeof settingsisopen==="function" && settingsisopen() && settingstab==="tv"){ renderpane(); }
}

function renderdebuggerstatus(box){
	const text=!rooted?"":
		debuggerstate==="closed"?"Port 9998 is closed to the network. Developers can reach it with: ssh -L 9998:localhost:9998 root@<TV address>":
		debuggerstate==="unsupported"?"This TV has no firewall, so port 9998 can't be closed. Keep the TV on a network that untrusted devices can't reach.":
		debuggerstate==="open"?(prefs.debuggerOpen?"Port 9998 is open to anyone on your network.":"Couldn't close port 9998."):"Checking...";
	if(text){ box.appendChild(el("div","sstatus",text)); }
}
