//SPDX-License-Identifier: WTFNMFPL
// Settings > App updates > "Install update" (needs root). The page can't replace itself: installing closes it partway
// through. So it hands the whole job to a small shell script that runs as root (Homebrew Channel's exec), detached
// from this app: download the newest release's .ipk from GitHub, check it against the SHA-256 that GitHub publishes
// for the file, install it with the TV's own installer, then start the launcher again. The script writes each step
// to a status file, which this page reads every couple of seconds to show progress and errors.

// The release must be signed. scripts/sign-release.sh signs each release's .ipk with a key that never leaves the
// maintainer's computer (not GitHub, not the build), and uploads the signature as <file>.ipk.sig. The TV checks it against
// the public key below with openssl before installing. So even someone who took over the GitHub account or the build
// couldn't get the TV to install their own .ipk: they don't have the key. Unsigned releases are not installed.
const UPDATE_PUBLIC_KEY=[
	"-----BEGIN PUBLIC KEY-----",
	"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE+xfaUnFF6xvxFvGlTk1DirHnaQHx",
	"ntIJ1GoGuTNYQqGukrN4Mg/ObLkxr06w0TCmNr0u/7Xyom/VL1Qo+wTAjA==",
	"-----END PUBLIC KEY-----",
	""
].join("\n");
const UPDATE_FLAG_KEY="openlauncher.updatingto";   // the tag being installed, so the next launch can say it worked
const UPDATE_URL_OK=new RegExp("^https://github\\.com/"+GITHUB_REPO.replace(/[.]/g,"\\.")+"/releases/download/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\\.ipk$");
const UPDATE_DIR_OK=/^\/tmp\/openlauncher-update\.[A-Za-z0-9]+$/;

// Runs as root, in its own folder that only root can open (made with mktemp, see installupdate): nothing in /tmp that
// another app could have put there or could change while it runs. $1 = the .ipk link, $2 = its sha256, $3 = the
// signature's link (all checked in installupdate() before they get here). The public key is next to it, in key.pem.
const UPDATE_SCRIPT=[
	"#!/bin/sh",
	"W=$(dirname \"$0\")",
	"S=\"$W/status\"",
	"F=\"$W/update.ipk\"",
	"G=\"$W/update.sig\"",
	"get () { curl --proto '=https' --proto-redir '=https' -fsSL --retry 2 --max-filesize 300000000 -o \"$2\" \"$1\"; }",
	"echo downloading > \"$S\"",
	"if ! get \"$1\" \"$F\" || ! get \"$3\" \"$G\"; then echo 'failed:download' > \"$S\"; rm -f \"$F\" \"$G\"; exit 1; fi",
	"echo verifying > \"$S\"",
	"if [ \"$(sha256sum \"$F\" | cut -d' ' -f1)\" != \"$2\" ]; then echo 'failed:checksum' > \"$S\"; rm -f \"$F\"; exit 1; fi",
	"if ! command -v openssl >/dev/null || ! openssl dgst -sha256 -verify \"$W/key.pem\" -signature \"$G\" \"$F\" >/dev/null 2>&1; then echo 'failed:signature' > \"$S\"; rm -f \"$F\"; exit 1; fi",
	"echo installing > \"$S\"",
	// the installer keeps its subscription open after it reports "installed", so its output goes to a file that is
	// watched here, and luna-send is stopped as soon as the result shows up (up to 5 minutes)
	"L=\"$W/install.log\"",
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
	"rm -f \"$F\" \"$G\" \"$L\"",
	"if [ $R != ok ]; then echo 'failed:install' > \"$S\"; exit 1; fi",
	"echo installed > \"$S\"",
	"sleep 2",
	"luna-send -n 1 luna://com.webos.applicationManager/launch '{\"id\":\""+ABOUT_APP_ID+"\"}'",
	""
].join("\n");

// idle | checking | uptodate | downloading | verifying | installing | installed | failed (+ why)
let updatestate={step:"idle"};
let updatepoll=null;
let updatedir=null;       // the private folder the running update works in

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
		install:"The TV refused to install "+tag+". Try installing it from Homebrew Channel instead.",
		signature:tag+" isn't signed by OpenLauncher's key (or the signature doesn't match), so it wasn't installed.",
		unsigned:tag+" isn't signed yet, so it wasn't installed. Try again a little later."
	}[updatestate.why] || "The update failed.";
}

// the newest release, with its .ipk link and checksum
async function fetchlatestrelease() {
	const response=await fetch(GITHUB_API);
	const list=await response.json();
	const latest=Array.isArray(list)?list[0]:null;
	if(!latest || !latest.tag_name){ throw new Error("no release"); }
	const assets=latest.assets || [];
	const asset=assets.filter((each) => /\.ipk$/.test(each.name || ""))[0];
	const signature=asset?assets.filter((each) => each.name===asset.name+".sig")[0]:null;
	about.release={state:"ok",tag:latest.tag_name,date:latest.published_at,pre:!!latest.prerelease};
	return {
		tag:latest.tag_name,
		url:asset?asset.browser_download_url:null,
		sigurl:signature?signature.browser_download_url:null,
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
	if(!latest.sigurl || latest.sigurl!==latest.url+".sig"){
		setupdatestate({step:"failed",why:"unsigned",tag:latest.tag});
		return;
	}
	try { localStorage.setItem(UPDATE_FLAG_KEY,latest.tag); } catch(e) {}
	setupdatestate({step:"downloading",tag:latest.tag,mb:latest.mb});
	// a new folder only root can open (mktemp makes it, so nothing can be waiting there), with the script and the key
	// in it. Both go over as base64, so no quote in them can break the command they're wrapped in.
	let result;
	try {
		const made=await execasroot("umask 077; mktemp -d /tmp/openlauncher-update.XXXXXX");
		const dir=String((made && made.stdoutString) || "").trim();
		if(!UPDATE_DIR_OK.test(dir)){ throw new Error("no folder"); }
		updatedir=dir;
		result=await execasroot("cd "+dir+" && echo "+btoa(UPDATE_SCRIPT)+" | base64 -d > run.sh && echo "+btoa(UPDATE_PUBLIC_KEY)+" | base64 -d > key.pem && "+
			"echo starting > status && setsid sh "+dir+"/run.sh "+shellquote(latest.url)+" "+latest.sha256+" "+shellquote(latest.sigurl)+" >/dev/null 2>&1 </dev/null &");
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
		if(!updatedir){ return; }
		const result=await execasroot("cat "+updatedir+"/status 2>/dev/null");
		status=String(result.stdoutString || "").trim();
	} catch(e) {}
	if(!status || status==="starting" || status===updatestate.step){ return; }
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
	if(tag && tag==="v"+APP_RELEASE){
		toasty("OpenLauncher updated to "+tag);
		// this version came through the signed updater: its signature was checked on this TV before it was installed
		try { localStorage.setItem(SIGNED_INSTALL_KEY,APP_RELEASE); } catch(e) {}
	}
}

// the version that is running now was installed by the signed updater on this TV (App updates shows a badge)
const SIGNED_INSTALL_KEY="openlauncher.signedinstall";
function signedinstall() {
	try { return localStorage.getItem(SIGNED_INSTALL_KEY)===APP_RELEASE; } catch(e) { return false; }
}

// what the update is doing, in words (App updates shows it)
function updatetext() {
	const tag=updatestate.tag || "";
	const text={
		idle:"Downloads the newest release from GitHub, checks that it is signed by OpenLauncher's key, installs it and reopens the launcher. Your settings are kept.",
		checking:"Checking GitHub...",
		uptodate:"You already have the newest release ("+tag+").",
		downloading:"Downloading "+tag+"..."+(updatestate.mb?" ("+updatestate.mb+" MB)":""),
		verifying:"Checking the download...",
		installing:"Installing "+tag+"... the launcher will close and reopen by itself.",
		installed:"Installed "+tag+". Reopening the launcher...",
		failed:updatefailtext()
	}[updatestate.step];
	return text || "";
}

updatewelcome();
