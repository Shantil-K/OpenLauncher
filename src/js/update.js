//SPDX-License-Identifier: WTFNMFPL
// Settings > App info > "Install update" (needs root). The page can't replace itself: installing closes it partway
// through. So it hands the whole job to a small shell script that runs as root (Homebrew Channel's exec), detached
// from this app: download the newest release's .ipk from GitHub, check it against the SHA-256 that GitHub publishes
// for the file, install it with the TV's own installer, then start the launcher again. The script writes each step
// to a status file, which this page reads every couple of seconds to show progress and errors.

const UPDATE_STATUS_FILE="/tmp/openlauncher-update.status";
const UPDATE_SCRIPT_FILE="/tmp/openlauncher-update.sh";
const UPDATE_IPK_FILE="/tmp/openlauncher-update.ipk";
const UPDATE_FLAG_KEY="openlauncher.updatingto";   // the tag being installed, so the next launch can say it worked
const UPDATE_URL_OK=new RegExp("^https://github\\.com/"+GITHUB_REPO.replace(/[.]/g,"\\.")+"/releases/download/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\\.ipk$");

// $1 = download link, $2 = sha256 (both checked in installupdate() before they get here)
const UPDATE_SCRIPT=[
	"#!/bin/sh",
	"S="+UPDATE_STATUS_FILE,
	"F="+UPDATE_IPK_FILE,
	"rm -f \"$F\"",
	"echo downloading > \"$S\"",
	"if ! curl -fsSL --retry 2 -o \"$F\" \"$1\"; then echo 'failed:download' > \"$S\"; rm -f \"$F\"; exit 1; fi",
	"echo verifying > \"$S\"",
	"if [ \"$(sha256sum \"$F\" | cut -d' ' -f1)\" != \"$2\" ]; then echo 'failed:checksum' > \"$S\"; rm -f \"$F\"; exit 1; fi",
	"echo installing > \"$S\"",
	// the installer keeps its subscription open after it reports "installed", so its output goes to a file that is
	// watched here, and luna-send is stopped as soon as the result shows up (up to 5 minutes)
	"L=/tmp/openlauncher-update.log",
	"luna-send -w 300000 -i luna://com.webos.appInstallService/dev/install '{\"id\":\"com.ares.defaultName\",\"ipkUrl\":\"'\"$F\"'\",\"subscribe\":true}' > \"$L\" 2>&1 &",
	"P=$!",
	"R=fail",
	"i=0",
	"while [ $i -lt 150 ]; do",
	"  if grep -q '\"state\":\"installed\"' \"$L\"; then R=ok; break; fi",
	"  if grep -q -E 'failed|\"returnValue\":false' \"$L\"; then break; fi",
	"  kill -0 $P 2>/dev/null || break",
	"  sleep 2; i=$((i+1))",
	"done",
	"grep -q '\"state\":\"installed\"' \"$L\" && R=ok",
	"kill $P 2>/dev/null",
	"rm -f \"$F\" \"$L\"",
	"if [ $R != ok ]; then echo 'failed:install' > \"$S\"; exit 1; fi",
	"echo installed > \"$S\"",
	"sleep 2",
	"luna-send -n 1 luna://com.webos.applicationManager/launch '{\"id\":\""+ABOUT_APP_ID+"\"}'",
	""
].join("\n");

// idle | checking | uptodate | downloading | verifying | installing | installed | failed (+ why)
let updatestate={step:"idle"};
let updatepoll=null;

// "1.2.0" vs "1.10.0-beta": compares the numbers; a version with a -suffix counts as older than the same one without
function compareversions(a,b) {
	const parse=(v) => {
		const parts=String(v).replace(/^v/,"").split("-");
		return {nums:parts[0].split(".").map((n) => parseInt(n,10) || 0),pre:parts.length>1};
	};
	const x=parse(a);
	const y=parse(b);
	for(let i=0;i<Math.max(x.nums.length,y.nums.length);i++){
		const d=(x.nums[i] || 0)-(y.nums[i] || 0);
		if(d!==0){ return d>0?1:-1; }
	}
	if(x.pre!==y.pre){ return x.pre?-1:1; }
	return 0;
}

function setupdatestate(state) {
	updatestate=state;
	if(state.step==="failed"){ toasty(updatefailtext()); }   // also seen when Settings is closed or scrolled away
	if(settingstab==="about"){ renderpane(); }
}

function updatefailtext() {
	const tag=updatestate.tag || "";
	return {
		github:"Couldn't reach GitHub. Check the TV's internet connection.",
		asset:tag+" has no installable .ipk (or no checksum) attached on GitHub.",
		root:"Couldn't start the update. Make sure Homebrew Channel's root service is working.",
		download:"The download from GitHub failed. Check the internet connection and try again.",
		checksum:"The downloaded file didn't match GitHub's checksum, so it wasn't installed. Try again.",
		install:"The TV refused to install "+tag+". Try installing it from Homebrew Channel instead."
	}[updatestate.why] || "The update failed.";
}

// the newest release, with its .ipk link and checksum
async function fetchlatestrelease() {
	const response=await fetch(GITHUB_API);
	const list=await response.json();
	const latest=Array.isArray(list)?list[0]:null;
	if(!latest || !latest.tag_name){ throw new Error("no release"); }
	const asset=(latest.assets || []).filter((each) => /\.ipk$/.test(each.name || ""))[0];
	about.release={state:"ok",tag:latest.tag_name,date:latest.published_at,pre:!!latest.prerelease};
	return {
		tag:latest.tag_name,
		url:asset?asset.browser_download_url:null,
		mb:asset && asset.size>0?Math.round(asset.size/1048576):0,
		sha256:asset && /^sha256:[0-9a-f]{64}$/.test(asset.digest || "")?asset.digest.slice(7):null
	};
}

async function installupdate() {
	if(!rooted || ["checking","downloading","verifying","installing","installed"].indexOf(updatestate.step)!==-1){ return; }
	setupdatestate({step:"checking"});
	let latest;
	try {
		latest=await fetchlatestrelease();
	} catch(e) {
		about.release={state:"error"};
		setupdatestate({step:"failed",why:"github"});
		return;
	}
	if(compareversions(latest.tag,APP_RELEASE)<=0){
		setupdatestate({step:"uptodate",tag:latest.tag});
		return;
	}
	if(!latest.url || !UPDATE_URL_OK.test(latest.url) || !latest.sha256){
		setupdatestate({step:"failed",why:"asset",tag:latest.tag});
		return;
	}
	try { localStorage.setItem(UPDATE_FLAG_KEY,latest.tag); } catch(e) {}
	setupdatestate({step:"downloading",tag:latest.tag,mb:latest.mb});
	// the script goes over as base64, so no quote in it can break the command it's wrapped in
	const command="rm -f "+UPDATE_STATUS_FILE+"; echo "+btoa(UPDATE_SCRIPT)+" | base64 -d > "+UPDATE_SCRIPT_FILE+" && "+
		"setsid sh "+UPDATE_SCRIPT_FILE+" '"+latest.url+"' "+latest.sha256+" >/dev/null 2>&1 </dev/null &";
	let result;
	try {
		result=await execasroot(command);
	} catch(e) {
		result={returnValue:false};
	}
	if(!result || result.returnValue===false || result.errorText!==undefined){
		setupdatestate({step:"failed",why:"root",tag:latest.tag});
		return;
	}
	clearInterval(updatepoll);
	updatepoll=setInterval(() => pollupdate(latest.tag),2000);
}

async function pollupdate(tag) {
	let status="";
	try {
		const result=await execasroot("cat "+UPDATE_STATUS_FILE+" 2>/dev/null");
		status=String(result.stdoutString || "").trim();
	} catch(e) {}
	if(!status || status===updatestate.step){ return; }
	if(status.indexOf("failed:")===0){
		clearInterval(updatepoll);
		try { localStorage.removeItem(UPDATE_FLAG_KEY); } catch(e) {}
		setupdatestate({step:"failed",why:status.slice(7),tag:tag});
		return;
	}
	if(status==="installed"){ clearInterval(updatepoll); }
	setupdatestate({step:status,tag:tag,mb:updatestate.mb});
}

// after the update relaunches the launcher: say it worked
function updatewelcome() {
	let tag=null;
	try {
		tag=localStorage.getItem(UPDATE_FLAG_KEY);
		localStorage.removeItem(UPDATE_FLAG_KEY);
	} catch(e) {}
	if(tag && tag==="v"+APP_RELEASE){ toasty("OpenLauncher updated to "+tag); }
}

function renderupdate(box) {
	const tag=updatestate.tag || "";
	const text={
		idle:"Downloads the newest release from GitHub, checks it, installs it and reopens the launcher. Your settings are kept.",
		checking:"Checking GitHub...",
		uptodate:"You already have the newest release ("+tag+").",
		downloading:"Downloading "+tag+"..."+(updatestate.mb?" ("+updatestate.mb+" MB)":""),
		verifying:"Checking the download...",
		installing:"Installing "+tag+"... the launcher will close and reopen by itself.",
		installed:"Installed "+tag+". Reopening the launcher...",
		failed:updatefailtext()
	}[updatestate.step];
	box.appendChild(el("div","sstatus",text));
}

updatewelcome();
