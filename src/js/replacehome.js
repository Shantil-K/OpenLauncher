//SPDX-License-Identifier: WTFNMFPL
// Settings > TV > Replace stock Home: runs one of the scripts in access/replace through the root service (Homebrew
// Channel's exec), so binding the physical Home button (and, for most methods, launching OpenLauncher at startup too)
// doesn't need SSH. See the main Readme's Replace / Auto-start sections and access/replace/Readme.md for what each
// method actually patches; this button automates those same steps and nothing else.

const REPLACE_METHODS={
	sixto24:{file:"keyfilters-6-24.sh",label:"webOS 6–24",short:"6–24",persist:true},
	twentyfive:{file:"keyfilters-25.sh",label:"webOS 25",short:"25",persist:true},
	defaultapp:{file:"appdefault-25-26.sh",label:"webOS 25–26 (Default App)",short:"25–26",persist:false},
	copilot:{file:"copilot-25-26.sh",label:"webOS 25–26 (copilot hijack)",short:"25–26 (copilot)",persist:true}
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
	"luna-send -n 1 -f 'luna://com.webos.service.applicationmanager/setDefaultApp' '{\"category\": \"home\",\"appId\":\"com.webos.app.home\"}'; "+
	"rm -f /var/lib/webosbrew/openlauncher/hackfilters.js /var/lib/webosbrew/openlauncher/libapp.so";
const RESTORE_COMMAND=RESTORE_STEPS+"; restart sam";

// single-quote a string for the root shell
function shquote(value){
	return "'"+String(value).replace(/'/g,"'\\''")+"'";
}

let replacestate={busy:false,action:null,ok:null};   // action: "apply" | "restore"; ok: null before it has run, then true or false
let homeconfirm=null;     // "apply" | "restore" while its one-line "are you sure" shows

// Is Home replaced now? Remembered when Apply works (and forgotten by Restore), and also read from the TV: the start-up
// copy and the mounted files the key filter and copilot methods leave, and the default Home app the 25-26 method sets.
const HOME_FLAG_KEY="openlauncher.homereplaced";
let homestate={applied:null};      // null until checked
const HOME_CHECK_COMMAND="[ -f /var/lib/webosbrew/init.d/replace.sh ] && echo initd; "+
	"grep -qE 'KeyFilters/systemUi.js|com.webos.app.home/lib/libapp.so' /proc/mounts && echo mounted; "+
	"luna-send -n 1 -w 3000 luna://com.webos.service.applicationmanager/getDefaultApp '{\"category\":\"home\"}' 2>/dev/null </dev/null; true";

function homeflag(){
	try { return !!localStorage.getItem(HOME_FLAG_KEY); } catch(e) { return false; }
}

function sethomeflag(on){
	try { if(on){ localStorage.setItem(HOME_FLAG_KEY,prefs.homeReplaceMethod); } else { localStorage.removeItem(HOME_FLAG_KEY); } } catch(e) {}
}

function homeredraw(){
	if(typeof settingsisopen==="function" && settingsisopen() && settingstab==="tv"){ renderpane(); }
}

async function checkhomestate(){
	if(!rooted){ return; }
	let out="";
	try {
		const result=await execasroot(HOME_CHECK_COMMAND);
		out=String((result && result.stdoutString) || "");
	} catch(e) {}
	homestate.applied=/initd|mounted/.test(out) || out.indexOf('"'+appid+'"')!==-1 || homeflag();
	homeredraw();
}

async function applyhomereplace() {
	if(replacestate.busy){ return; }
	const method=REPLACE_METHODS[prefs.homeReplaceMethod];
	if(!method){ return; }
	replacestate={busy:true,action:"apply",ok:null};
	homeredraw();
	try {
		const script=appdir+"/access/replace/"+method.file;
		await execasroot("sh "+shquote(script));
		if(method.persist){
			// the script's own mount --rbind doesn't survive a reboot; webosbrew re-runs everything in init.d at every boot
			await execasroot("cp "+shquote(script)+" /var/lib/webosbrew/init.d/replace.sh && chmod +x /var/lib/webosbrew/init.d/replace.sh");
		}
		replacestate={busy:false,action:"apply",ok:true};
		sethomeflag(true);
		homestate.applied=true;
		await toasty("Done. Press Home on the remote to check it.");
	} catch(e) {
		replacestate={busy:false,action:"apply",ok:false};
	}
	homeredraw();
}

// Settings > TV > Restore. Uninstalling OpenLauncher does NOT undo any of this on its own (the init.d script and the
// default app live outside the app's own storage), so do this first, or Home is left pointed at an app that's gone.
async function restorehome() {
	if(replacestate.busy){ return; }
	replacestate={busy:true,action:"restore",ok:null};
	homeredraw();
	try {
		await execasroot(RESTORE_COMMAND);
		replacestate={busy:false,action:"restore",ok:true};
		sethomeflag(false);
		homestate.applied=false;
		await toasty("Stock Home restored.");
	} catch(e) {
		replacestate={busy:false,action:"restore",ok:false};
	}
	homeredraw();
}

// the row: the webOS version, then Apply (or Restore once it is applied), each asking once before it restarts the system UI
function renderhomecontrol(box,item){
	const method={key:item.key,label:item.label,options:Object.keys(REPLACE_METHODS).map((id) => [id,REPLACE_METHODS[id].short])};
	stepper(method,box);
	if(replacestate.busy){
		const busy=optionbutton(replacestate.action==="restore"?"Restoring...":"Applying...",false,() => {});
		busy.disabled=true;
		box.appendChild(busy);
		return;
	}
	const action=homestate.applied?"restore":"apply";
	if(homeconfirm===action){
		box.appendChild(el("span","sconfirm","Restarts the TV's menus."));
		const yes=optionbutton(action==="restore"?"Yes, restore":"Yes, apply",false,() => {
			homeconfirm=null;
			if(action==="restore"){ restorehome(); } else { applyhomereplace(); }
		});
		yes.classList.add("action","danger");
		box.appendChild(yes);
		box.appendChild(optionbutton("Cancel",false,() => { homeconfirm=null; renderpane(); }));
		return;
	}
	const button=optionbutton(action==="restore"?"Restore":"Apply",false,() => { homeconfirm=action; renderpane(); },action==="restore"?"reset":"open");
	button.classList.add("action");
	if(homestate.applied===null){ button.disabled=true; }
	box.appendChild(button);
}

function renderhomereplace(box){
	let text;
	if(replacestate.busy){ text="This restarts the TV's menus, so the screen may flicker or go dark for a moment."; }
	else if(replacestate.ok===false){ text=replacestate.action==="restore"?"Couldn't restore LG's Home. Try again, or see access/replace/Readme.md to undo it over SSH.":"That didn't work. Try another webOS version, or check the firmware in App updates."; }
	else if(homestate.applied===null){ text="Checking..."; }
	else if(homestate.applied){ text="Home opens OpenLauncher. Restore puts LG's Home back."; }
	else { text="Home opens LG's Home. Apply makes it open OpenLauncher."; }
	box.appendChild(el("div","sstatus",text));
}

// Settings > App updates > "Uninstall OpenLauncher". Rooted: restore-fix and self-removal are sent as ONE shell
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
		const command=RESTORE_STEPS+"; "+POWERON_REMOVE_COMMAND+"; "+DEBUGGER_OPEN_COMMAND+"; rm -rf /var/lib/webosbrew/openlauncher; "+
			"luna-send -n 1 -f 'luna://com.webos.appInstallService/remove' '{\"id\":\""+appid+"\",\"subscribe\":false}'; "+
			"restart sam";
		try {
			await toasty("Restoring stock Home and uninstalling OpenLauncher...");
			sethomeflag(false);
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
	let text=rooted?"Restores the stock Home screen first (if it was replaced) and the app the TV starts with, then uninstalls OpenLauncher."
		:"Uninstalls OpenLauncher. Needs trusted trustLevel or root; without root the Replace Home fix is skipped since it was never usable without root either.";
	if(uninstallstate.busy){ text="Working... the app may close on its own once this finishes."; }
	else if(uninstallstate.ok===false){ text="Couldn't uninstall it from here. Remove it from the TV's own app/content manager, or Homebrew Channel's App Manager, instead."; }
	box.appendChild(el("div","sstatus",text));
}
