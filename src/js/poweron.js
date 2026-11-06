//SPDX-License-Identifier: WTFNMFPL
// Settings > TV > "When the TV turns on": open OpenLauncher instead of Live TV (rooted TVs).
//
// The method is the one Hearth (github.com/rudra-avatar/Hearth, MIT) uses. At power-on the TV's boot daemon (bootd) picks
// the first app from a table in /etc/palm/bootd.json, "firstAppByPowerOnReason": why the TV was switched on -> which app.
// For the remote's power button ("remoteKey") and the TV's own button ("localKey") it says "{LAST_APP}" (Live TV or the
// last input). bootd reads /var/luna/preferences/bootd.json instead when that file exists, so OpenLauncher writes LG's file
// there with those reasons pointed at itself. Everything else (casting, HDMI-CEC, timers...) stays as LG has it.
//
// bootd reads the file only when it starts, so it works from the next full restart (not waking from standby). A small
// check (access/poweron/guard.sh) runs at every start: it notes whether the copy was loaded, and removes it when
// OpenLauncher is uninstalled or a software update changes LG's file.

const POWERON_STOCK="/etc/palm/bootd.json";
const POWERON_OVERRIDE="/var/luna/preferences/bootd.json";
const POWERON_BOOTD="/usr/sbin/bootd";
// Only root can write to /var/lib/webosbrew. The check runs as root at every start, so it and the files it trusts must not
// be in /media/developer or /tmp, where any app on the TV can write.
const POWERON_BASE="/var/lib/webosbrew/openlauncher";
const POWERON_DIR=POWERON_BASE+"/poweron";
const POWERON_LINK="/var/lib/webosbrew/init.d/45-openlauncher-poweron";     // a copy of guard.sh, not a link to it
const POWERON_OLD_DIR="/media/developer/openlauncher/poweron";               // where a test build kept it (removed)
// the power button on the remote, the one on the TV, and a cold start (power back after an outage, or a restart). LG's table
// has no micomPower entry, so a restart opened Live TV; bootd looks the reason up in the table, so adding it works (as Hearth does)
const POWERON_REASONS=["remoteKey","localKey","micomPower"];

// the copy in place is the one OpenLauncher wrote (its sum is noted in override.md5)
const POWERON_OURS="{ [ -f '"+POWERON_OVERRIDE+"' ] && [ \"$(md5sum '"+POWERON_OVERRIDE+"' | cut -d ' ' -f 1)\" = \"$(cat '"+POWERON_DIR+"/override.md5' 2>/dev/null)\" ]; }";

const POWERON_STATUS_COMMAND=[
	"if grep -q '"+POWERON_OVERRIDE+"' '"+POWERON_BOOTD+"' 2>/dev/null && grep -q firstAppByPowerOnReason '"+POWERON_STOCK+"' 2>/dev/null; then echo support=yes; else echo support=no; fi",
	"if [ -f '"+POWERON_OVERRIDE+"' ]; then echo override=yes; else echo override=no; fi",
	"if "+POWERON_OURS+"; then echo ours=yes; else echo ours=no; fi",
	"echo \"loaded=$(cat /tmp/openlauncher-poweron/loaded 2>/dev/null)\"",
	"true"
].join("; ");

// back to the TV's own behaviour from the next start (another app's copy is left alone). Also run by selfuninstall().
const POWERON_REMOVE_COMMAND=[
	"rm -f '"+POWERON_OVERRIDE+".openlauncher-new'",
	"if "+POWERON_OURS+"; then rm -f '"+POWERON_OVERRIDE+"'; fi",
	"rm -f '"+POWERON_LINK+"'",
	"rm -rf '"+POWERON_DIR+"'",
	"rm -rf '"+POWERON_OLD_DIR+"'",
	"sync"
].join("; ");

let poweron={status:null,busy:false,message:"",asking:false};   // status: null = not read yet, else {supported, chosen, loaded, foreign}

function parsepoweron(output){
	const fields={};
	String(output).split("\n").forEach((line) => {
		const eq=line.indexOf("=");
		if(eq>0){ fields[line.slice(0,eq).trim()]=line.slice(eq+1).trim(); }
	});
	if(!fields.support){ return null; }
	const ours=fields.ours==="yes";
	return {
		supported:fields.support==="yes",
		chosen:ours,
		foreign:fields.override==="yes" && !ours,
		// the start-up check writes "on" or "off"; nothing there means it hasn't run since the last restart
		// the check writes "on" or "off" at each start (into /tmp, which starts empty); nothing there: it hasn't run yet
		loaded:fields.loaded==="on"?true:fields.loaded==="off"?false:null
	};
}

function poweronredraw(){
	if(settingsisopen() && settingstab==="tv"){ renderpane(); }
}

async function loadpoweron(){
	if(!rooted || poweron.busy){ return; }
	try {
		poweron.status=parsepoweron(await rootoutput(POWERON_STATUS_COMMAND));
	} catch(e) {
		poweron.status=null;
	}
	poweronredraw();
}

// LG's file with the power-on reasons pointed at the launcher; throws when the file isn't the kind this knows
function buildpoweron(stocktext){
	const stock=JSON.parse(stocktext);
	if(!stock || typeof stock!=="object" || !stock.common || typeof stock.common!=="object" || !stock.common.firstAppByPowerOnReason || typeof stock.common.firstAppByPowerOnReason!=="object"){
		throw new Error("unknown start-up file");
	}
	const table=Object.assign({},stock.common.firstAppByPowerOnReason);
	POWERON_REASONS.forEach((reason) => { table[reason]=appid; });
	const common=Object.assign({},stock.common,{firstAppByPowerOnReason:table});
	return JSON.stringify(Object.assign({},stock,{common:common}),null,4)+"\n";
}

function base64text(text){
	// UTF-8 safe
	return btoa(unescape(encodeURIComponent(text)));
}

async function runstep(command){
	const result=await execasroot(command);
	if(!result || result.returnValue===false || result.errorText){ throw new Error((result && (result.stderrString || result.errorText)) || "no answer"); }
	return String(result.stdoutString || "");
}

async function enablepoweron(){
	if(poweron.busy){ return; }
	poweron.busy=true;
	poweron.message="Setting it up...";
	poweronredraw();
	const temp=POWERON_OVERRIDE+".openlauncher-new";
	try {
		const status=parsepoweron(await rootoutput(POWERON_STATUS_COMMAND));
		if(!status || !status.supported){ throw new Error("unsupported"); }
		if(status.foreign){ throw new Error("foreign"); }
		const text=buildpoweron(await runstep("cat '"+POWERON_STOCK+"'"));
		JSON.parse(text);     // never write anything bootd couldn't read
		await runstep("rm -rf '"+POWERON_OLD_DIR+"'; mkdir -p '"+POWERON_DIR+"' && chmod 700 '"+POWERON_BASE+"' '"+POWERON_DIR+"' && rm -f '"+temp+"' && echo '"+base64text(text)+"' | base64 -d > '"+temp+"'");
		if((await runstep("cat '"+temp+"'"))!==text){ throw new Error("the file didn't save"); }
		// the check is copied (not linked) into Homebrew Channel's start-up folder: the app's own folder is in /media/developer
		const guard=await runstep("cat "+shellquote(appdir+"/access/poweron/guard.sh"));
		if(guard.indexOf("#!/bin/sh")!==0){ throw new Error("the start-up check is missing"); }
		await runstep("rm -f '"+POWERON_DIR+"/guard.new' && echo '"+base64text(guard)+"' | base64 -d > '"+POWERON_DIR+"/guard.new' && chmod 755 '"+POWERON_DIR+"/guard.new'");
		await runstep([
			"md5sum '"+temp+"' | cut -d ' ' -f 1 > '"+POWERON_DIR+"/override.md5'",
			"md5sum '"+POWERON_STOCK+"' | cut -d ' ' -f 1 > '"+POWERON_DIR+"/stock.md5'",
			"printf '%s\\n' "+shellquote(appdir)+" > '"+POWERON_DIR+"/appdir'",
			"sync",
			"mv -f '"+temp+"' '"+POWERON_OVERRIDE+"'",
			"mv -f '"+POWERON_DIR+"/guard.new' '"+POWERON_LINK+"'",
			"sync"
		].join(" && "));
		poweron.message="";
	} catch(e) {
		try { await execasroot("rm -f '"+temp+"'; if ! "+POWERON_OURS+"; then rm -f '"+POWERON_LINK+"'; rm -rf '"+POWERON_DIR+"'; fi; true"); } catch(e2) {}
		const why=String(e && e.message || e);
		poweron.message=why==="unsupported"?"This TV's software doesn't support choosing the app it starts with."
			:why==="foreign"?"Another app already changed what the TV starts with ("+POWERON_OVERRIDE+"). Turn it off there first."
			:"Couldn't set it up ("+why+"). Nothing was changed.";
	}
	poweron.busy=false;
	await loadpoweron();
	if(!poweron.message && poweron.status && poweron.status.chosen){ toasty("Done. The TV opens OpenLauncher from its next restart."); }
}

async function disablepoweron(){
	if(poweron.busy){ return; }
	poweron.busy=true;
	poweron.message="Putting it back...";
	poweronredraw();
	try {
		await runstep(POWERON_REMOVE_COMMAND);
		poweron.message="";
	} catch(e) {
		poweron.message="Couldn't change it back. Over SSH: sh "+POWERON_LINK+" remove";
	}
	poweron.busy=false;
	await loadpoweron();
}

function restarttv(){
	toasty("Restarting the TV...");
	execasroot("sync; reboot");
}

// what the TV does now, in words
function poweronsummary(status){
	if(!status){ return "Checking..."; }
	if(!status.supported){ return "This TV's software doesn't support choosing the app it starts with."; }
	if(status.foreign){ return "Another app has already changed what the TV starts with, so this is left alone."; }
	if(status.chosen){
		return status.loaded===true?"The TV opens OpenLauncher when you switch it on."
			:"Set. It works from the TV's next full restart (switching off with the remote is standby, not a restart).";
	}
	return status.loaded===true?"Off. It goes back to Live TV from the next full restart.":"The TV opens Live TV (or the last input) when you switch it on.";
}

function renderpoweron(box){
	const status=poweron.status;
	const controls=el("div","scontrol");
	const on=!!(status && status.chosen);
	// starting into OpenLauncher only makes sense once Home opens it too (Home button, above): until then this waits,
	// but a start-up that is already set can always be switched back
	const needshome=!on && typeof homestate!=="undefined" && homestate.applied!==true;
	const usable=!!(status && status.supported && !status.foreign) && !poweron.busy && !needshome;
	const openlauncher=optionbutton("OpenLauncher",on,() => { if(!on){ enablepoweron(); } },"apps");
	const tv=optionbutton("Live TV",!on,() => { if(on){ disablepoweron(); } },"tv");
	[openlauncher,tv].forEach((btn) => {
		btn.classList.add("compact");
		if(!usable){ btn.disabled=true; }
		controls.appendChild(btn);
	});
	if(needshome){
		// why it can't be used yet, in the space beside the buttons
		controls.appendChild(el("span","sinlinenote","Turn on the Home button above first."));
	}
	box.appendChild(controls);
	if(!needshome || poweron.message){ box.appendChild(el("div","sstatus",poweron.message || poweronsummary(status))); }
	// a change waits for a restart: offer one
	const pending=status && status.supported && !status.foreign && status.loaded!==null && status.chosen!==status.loaded;
	const unknown=status && status.chosen && status.loaded===null;
	if((pending || unknown) && !poweron.busy){
		const restart=el("div","scontrol");
		if(poweron.asking){
			restart.appendChild(el("span","sconfirm","Restart the TV now?"));
			const yes=optionbutton("Yes, restart",false,() => { poweron.asking=false; restarttv(); });
			yes.classList.add("danger");
			restart.appendChild(yes);
			restart.appendChild(optionbutton("Cancel",false,() => { poweron.asking=false; renderpane(); }));
		} else {
			restart.appendChild(optionbutton("Restart the TV now",false,() => { poweron.asking=true; renderpane(); },"power"));
		}
		box.appendChild(restart);
	}
}
