//SPDX-License-Identifier: WTFNMFPL
// Settings > TV > Replace stock Home: runs one of the scripts in access/replace through the root service (Homebrew
// Channel's exec), so binding the physical Home button (and, for most methods, launching OpenLauncher at startup too)
// doesn't need SSH. See the main Readme's Replace / Auto-start sections and access/replace/Readme.md for what each
// method actually patches; this button automates those same steps and nothing else.

const REPLACE_METHODS={
	sixto24:{file:"keyfilters-6-24.sh",label:"webOS 6–24",persist:true},
	twentyfive:{file:"keyfilters-25.sh",label:"webOS 25",persist:true},
	defaultapp:{file:"appdefault-25-26.sh",label:"webOS 25–26 (Default App)",persist:false},
	copilot:{file:"copilot-25-26.sh",label:"webOS 25–26 (copilot hijack)",persist:true}
};

// Auto-picks a webOS version above by reading the actual system file the scripts target, instead of guessing from
// sdkVersion: LG doesn't document a mapping from sdkVersion to the marketing "webOS 22/23/24/25" numbers (even
// experienced webOS devs online call that mapping "a big fat guess"), so a version-number heuristic would just be
// confidently wrong sometimes. Reading /usr/lib/qml/KeyFilters/systemUi.js is a real fact about the device instead
// of a guess: keyfilters-6-24.sh only makes sense if that file still hardcodes "com.webos.app.home" (older
// webOS), and if it doesn't, the device is on the newer launchDefaultApp-based scheme (webOS 25+).
// It can't go further than that split, though: "webOS 25" vs "webOS 25-26" differ in whether the OS actually
// honors a setDefaultApp call for the home category, which is a runtime behaviour of a different service, not
// something the file's text says - so within the newer bucket this preselects "defaultapp" (Default App), the
// least invasive method, on the assumption that it's worth trying first regardless; "webOS 25" (the file patch)
// is the fallback if Home doesn't actually pick it up.
let methoddetected=null;   // null = not run yet, else "LEGACY" | "MODERN" | "unknown"
const DETECT_COMMAND="if grep -q 'com.webos.app.home' /usr/lib/qml/KeyFilters/systemUi.js 2>/dev/null; then echo LEGACY; "+
	"elif [ -f /usr/lib/qml/KeyFilters/systemUi.js ]; then echo MODERN; else echo MISSING; fi";

async function detecthomemethod() {
	if(!rooted || methoddetected!==null){ return; }
	try {
		const result=await execasroot(DETECT_COMMAND);
		const out=String((result && result.stdoutString) || "").trim();
		methoddetected=out || "unknown";
		if(out==="LEGACY"){ setpref("homeReplaceMethod","sixto24"); }
		else if(out==="MODERN"){ setpref("homeReplaceMethod","defaultapp"); }
	} catch(e) {
		methoddetected="unknown";
	}
	if(settingstab==="tv"){ renderpane(); }
}

// Undoes all three mechanisms above unconditionally (not just the one currently picked), so it's a safe "put it
// back" regardless of which method was actually applied, or of switching the picker afterward. Each step is a
// best-effort no-op if that particular thing was never done:
//  - removes webosbrew's init.d copy, so nothing re-patches at the next boot
//  - un-mounts the two files the scripts can bind-mount over (systemUi.js, the copilot libapp.so)
//  - kills the home flutter-client so it restarts clean with its original libapp.so
//  - resets the Luna DB's default Home app back to the stock id (webOS 25-26 defaultApp method)
// RESTORE_STEPS stops just short of "restart sam" so selfuninstall() below can splice its own removal call in
// before that final restart; RESTORE_COMMAND is that plus the restart, for the plain "Restore stock Home" button.
const RESTORE_STEPS="rm -f /var/lib/webosbrew/init.d/replace.sh; "+
	"umount /usr/lib/qml/KeyFilters/systemUi.js 2>/dev/null; "+
	"umount /usr/palm/applications/com.webos.app.home/lib/libapp.so 2>/dev/null; "+
	"pgrep -la flutter-client | grep 'com.webos.app.home' | awk '{print $1}' | while read A ; do kill -9 $A ; done; "+
	"luna-send -n 1 -f 'luna://com.webos.service.applicationmanager/setDefaultApp' '{\"category\": \"home\",\"appId\":\"com.webos.app.home\"}'";
const RESTORE_COMMAND=RESTORE_STEPS+"; restart sam";

let replacestate={busy:false,action:null,ok:null};   // action: "apply" | "restore"; ok: null before it has run, then true or false

function shquote(value){
	return "'"+String(value).replace(/'/g,"'\\''")+"'";
}

async function applyhomereplace() {
	if(replacestate.busy){ return; }
	const method=REPLACE_METHODS[prefs.homeReplaceMethod];
	if(!method){ return; }
	replacestate={busy:true,action:"apply",ok:null};
	if(settingstab==="tv"){ renderpane(); }
	try {
		const script=appdir+"/access/replace/"+method.file;
		await execasroot("sh "+shquote(script));
		if(method.persist){
			// the script's own mount --rbind doesn't survive a reboot; webosbrew re-runs everything in init.d at every boot
			await execasroot("cp "+shquote(script)+" /var/lib/webosbrew/init.d/replace.sh && chmod +x /var/lib/webosbrew/init.d/replace.sh");
		}
		replacestate={busy:false,action:"apply",ok:true};
		await toasty("Done. Press Home on the remote to check it.");
	} catch(e) {
		replacestate={busy:false,action:"apply",ok:false};
	}
	if(settingstab==="tv"){ renderpane(); }
}

// Settings > TV > "Restore stock Home". Important: uninstalling OpenLauncher does NOT undo any of this on its own
// (the init.d script and the Luna DB's default app live outside the app's own storage, so they survive an
// uninstall) - press this first, or Home is left pointed at an app that's no longer there.
async function restorehome() {
	if(replacestate.busy){ return; }
	replacestate={busy:true,action:"restore",ok:null};
	if(settingstab==="tv"){ renderpane(); }
	try {
		await execasroot(RESTORE_COMMAND);
		replacestate={busy:false,action:"restore",ok:true};
		await toasty("Stock Home restored.");
	} catch(e) {
		replacestate={busy:false,action:"restore",ok:false};
	}
	if(settingstab==="tv"){ renderpane(); }
}

// Settings > App info > "Uninstall OpenLauncher". Rooted: restore-fix and self-removal are sent as ONE shell
// command to the root service (org.webosbrew.hbchannel.service/exec), which runs on the TV independently of this
// app's own process - so it keeps going even if "restart sam" (at the end) or the uninstall itself tears this
// page down partway through. It also sidesteps canuninstall()'s normal "the launcher can't uninstall itself"
// block in main.js, which stops the app's own sandboxed service bridge from targeting its own id; the root shell's
// luna-send isn't going through that sandboxed call, so it stands a real chance of actually working.
// Not rooted: falls back to the same PalmServiceBridge call other apps are uninstalled with (needs trusted
// trustLevel). This may hit the same self-targeting restriction canuninstall() exists for - it's untested, since
// self-uninstall isn't something the TV is normally asked to do.
let uninstallstate={busy:false,ok:null};

async function selfuninstall() {
	if(uninstallstate.busy){ return; }
	uninstallstate={busy:true,ok:null};
	if(settingstab==="about"){ renderpane(); }
	if(rooted){
		const command=RESTORE_STEPS+"; "+
			"luna-send -n 1 -f 'luna://com.webos.appInstallService/remove' '{\"id\":\""+appid+"\",\"subscribe\":false}'; "+
			"restart sam";
		try {
			await toasty("Restoring stock Home and uninstalling OpenLauncher...");
			await execasroot(command);
			uninstallstate={busy:false,ok:true};
		} catch(e) {
			uninstallstate={busy:false,ok:false};
		}
	} else {
		let result;
		try {
			result=await lunacall('luna://com.webos.appInstallService/remove',{"id":appid,"subscribe":false});
		} catch(e) {
			result={errorText:String(e)};
		}
		if(!result || result.returnValue===false || result.errorText!==undefined){
			uninstallstate={busy:false,ok:false};
			toasty("Couldn't uninstall OpenLauncher"+((result && result.errorText)?": "+result.errorText:"."));
		} else {
			uninstallstate={busy:false,ok:true};
			toasty("Uninstalling OpenLauncher...");
		}
	}
	if(settingstab==="about"){ renderpane(); }
}

function renderuninstall(box){
	let text=rooted?"Restores the stock Home screen first (if it was replaced), then uninstalls OpenLauncher."
		:"Uninstalls OpenLauncher. Needs trusted trustLevel or root; without root the Replace Home fix is skipped since it was never usable without root either.";
	if(uninstallstate.busy){ text="Working... the app may close on its own once this finishes."; }
	else if(uninstallstate.ok===false){ text="Couldn't uninstall it from here. Remove it from the TV's own app/content manager, or Homebrew Channel's App Manager, instead."; }
	box.appendChild(el("div","sstatus",text));
}

function renderhomereplace(box){
	const method=REPLACE_METHODS[prefs.homeReplaceMethod];
	let text=method?("Apply runs "+method.file+" through the root service"+(method.persist?", then copies it into webosbrew's init.d so it survives a reboot.":" (this method is already persistent, no init.d copy needed).")+
		" Restore stock Home undoes it (and any other method you tried before) - do this before uninstalling OpenLauncher, since uninstalling on its own leaves Home pointed at an app that's gone.")
		:"Pick a webOS range above first.";
	if(replacestate.busy){ text=(replacestate.action==="restore"?"Restoring...":"Applying...")+" this restarts the system UI, so the screen may flicker or go black for a moment."; }
	else if(replacestate.ok===true){ text=replacestate.action==="restore"?"Stock Home restored. Press Home to check.":"Done. Press Home on the remote to check it."; }
	else if(replacestate.ok===false){ text="Something went wrong. Make sure the device is rooted, or do it manually over SSH instead (see the Readme's Replace section)."; }
	box.appendChild(el("div","sstatus",text));
}
