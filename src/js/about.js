//SPDX-License-Identifier: WTFNMFPL
// Settings > App info: a system-information page for the launcher, like the one on a PC. The launcher itself (release, package,
// when it was last updated, what it is allowed to do), your configuration (is a backup saved, how much you changed), the
// wallpaper, the screen, the TV, and the GitHub project. Some facts need the TV (model, firmware) or root (the backup file),
// or the internet (the latest release, only when you press Check for updates); those say so when they are not available.

const APP_RELEASE="0.7.2-beta";       // the GitHub release this build belongs to; change it with each release
const GITHUB_REPO="Shantil-K/OpenLauncher";
const GITHUB_API="https://api.github.com/repos/"+GITHUB_REPO+"/releases?per_page=1";   // per_page=1 of ALL releases: "latest" skips pre-releases
const LAST_BACKUP_KEY='openlauncher.lastbackup';
const ABOUT_APP_ID="com.homebrew.openlauncher";

// what has been looked up; each entry is filled in once (or again by Refresh) and the page is drawn again when it arrives
let about={tv:undefined,backupfile:undefined,release:{state:"idle"}};

function aboutdate(value) {
	const date=value instanceof Date?value:new Date(value);
	if(isNaN(date.getTime()) || date.getTime()<=0){ return null; }
	return date.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})+", "+date.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
}

function aboutbytes(count) {
	return count<1024?count+" B":(Math.round(count/102.4)/10)+" KB";
}

// how much of localStorage the launcher uses (keys and values, two bytes a character)
function aboutstorage() {
	let chars=0;
	try {
		for(let i=0;i<localStorage.length;i++){
			const key=localStorage.key(i);
			if(key && key.indexOf("openlauncher.")===0){ chars+=key.length+String(localStorage.getItem(key)).length; }
		}
	} catch(e) {}
	return chars*2;
}

// "Chromium 87" from the user agent
function aboutengine() {
	const match=/Chrome\/(\d+)/.exec(navigator.userAgent || "");
	return match?"Chromium "+match[1]:"Unknown";
}

// What the screen really has. A web app on a webOS TV can be drawn at 1920 x 1080 (sometimes with a pixel ratio of 2, sometimes
// scaled up by the TV), so the page size alone says "1080p" on a 4K TV. The panel is the biggest of: the page size times the
// pixel ratio, the screen size the browser reports, the size webOS reports (deviceInfo), and 4K when the TV says it is a UHD set.
function aboutresolution() {
	const ratio=window.devicePixelRatio || 1;
	const screensize=window.screen || {};
	const device=webosdeviceinfo() || {};
	let width=Math.max(Math.round(window.innerWidth*ratio),Math.round((screensize.width || 0)*ratio),parseInt(device.screenWidth,10) || 0);
	let height=Math.max(Math.round(window.innerHeight*ratio),Math.round((screensize.height || 0)*ratio),parseInt(device.screenHeight,10) || 0);
	const uhd=(about.tv && String(about.tv.uhd)==="true") || String(device.uhd)==="true";
	if(uhd && width<3840){
		width=3840;
		height=2160;
	}
	const name=height>=4320?"8K":height>=2160?"4K":height>=1440?"QHD":height>=1080?"Full HD":height>=720?"HD":"SD";
	return {panel:width+" x "+height+" ("+name+")",page:window.innerWidth+" x "+window.innerHeight+(ratio!==1?" @ "+ratio+"x":"")};
}

function aboutpermissions() {
	if(rooted){ return "Root (webOS Homebrew)"; }
	return turstedapp?"Trusted app":"Standard (some features limited)";
}

// the file the backup writes with root: does it exist, and when was it written
async function lookupbackupfile() {
	if(!rooted){
		about.backupfile=null;
		return;
	}
	try {
		const result=await execasroot("stat -c %Y "+BACKUP_FILE);
		const seconds=parseInt(String(result.stdoutString || "").trim(),10);
		about.backupfile=(result.returnValue!==false && seconds>0)?{at:seconds*1000}:{missing:true};
	} catch(e) {
		about.backupfile={missing:true};
	}
}

// what webOS itself tells a web app about the set (window.webOSSystem.deviceInfo, a JSON string): model, version, panel size, UHD
function webosdeviceinfo() {
	try {
		const raw=window.webOSSystem && window.webOSSystem.deviceInfo;
		const info=typeof raw==="string"?JSON.parse(raw):raw;
		return info && typeof info==="object"?info:null;
	} catch(e) {
		return null;
	}
}

async function lookuptv() {
	const keys={"keys":["modelName","firmwareVersion","sdkVersion","UHD"]};
	let info=null;
	try {
		info=await lunacall('luna://com.webos.service.tv.systemproperty/getSystemInfo',keys);
		if(info.returnValue===false || info.errorText!==undefined){ info=null; }
	} catch(e) {}
	if(!info && rooted){
		try {
			info=await lunacallasroot('luna://com.webos.service.tv.systemproperty/getSystemInfo',keys);
			if(info.returnValue===false || info.errorText!==undefined){ info=null; }
		} catch(e) {}
	}
	about.tv=(info && info.modelName!==undefined)?{model:info.modelName,firmware:info.firmwareVersion,sdk:info.sdkVersion,uhd:info.UHD}:null;
	if(!about.tv){
		const device=webosdeviceinfo();
		if(device && device.modelName){
			about.tv={model:device.modelName,firmware:device.version || device.platformVersion,sdk:device.sdkVersion,uhd:device.uhd};
		}
	}
}

async function loadaboutdata() {
	await Promise.all([lookuptv(),lookupbackupfile()]);
	if(settingstab==="about"){ renderpane(); }
}

// the internet is only used when you ask
function checkupdates() {
	about.release={state:"checking"};
	renderpane();
	fetch(GITHUB_API).then((response) => response.json()).then((list) => {
		const latest=Array.isArray(list)?list[0]:null;
		about.release=latest && latest.tag_name?{state:"ok",tag:latest.tag_name,date:latest.published_at,pre:!!latest.prerelease}:{state:"error"};
	}).catch(() => {
		about.release={state:"error"};
	}).then(() => {
		if(settingstab==="about"){ renderpane(); }
	});
}

function aboutupdatetext() {
	const release=about.release;
	if(release.state==="checking"){ return "Checking..."; }
	if(release.state==="error"){ return "Couldn't reach GitHub"; }
	if(release.state!=="ok"){ return "Not checked"; }
	const mine="v"+APP_RELEASE;
	if(release.tag===mine){ return release.tag+" (this one), up to date"; }
	return release.tag+" is out (you have "+mine+")";
}

// every line of the page as [section, [[label, value], ...]], so the page and the tests read the same list
function aboutsections() {
	const app=(typeof applist!=="undefined" && applist)?applist.filter((each) => each.id===ABOUT_APP_ID)[0]:null;
	const changed=Object.keys(changedprefs()).length;
	const total=Object.keys(PREF_DEFAULTS).length;
	const lastexport=(function(){ try { return parseInt(localStorage.getItem(LAST_BACKUP_KEY),10); } catch(e) { return NaN; } })();
	const updated=aboutdate(app && app.installTime>0?app.installTime*1000:document.lastModified);
	let backup;
	if(rooted){
		if(about.backupfile===undefined){ backup="Checking..."; }
		else if(about.backupfile && about.backupfile.at){ backup="Saved, "+aboutdate(about.backupfile.at); }
		else { backup="Not saved yet (Settings > Backup > Export)"; }
	} else {
		backup=lastexport>0?"Exported as text, "+aboutdate(lastexport)+" (the file needs root)":"Not saved yet (Settings > Backup > Export)";
	}
	const streamed=(typeof aerials!=="undefined")?aerials:[];
	const sources={};
	streamed.forEach((video) => { sources[video.s]=true; });
	const source={online:"Online (streamed)",offline:"Offline (built in)",custom:"My own"}[prefs.videoSource] || prefs.videoSource;
	const playing=(typeof nowplaying==="function")?nowplaying().name:"";
	const tv=about.tv;
	const sysfolders=settings.folders.filter((folder) => issystemfolder(folder.id)).length;
	return [
		["Launcher",[
			["Release","v"+APP_RELEASE],
			["Package","com.homebrew.openlauncher, "+(app && app.version?app.version:"2.0.0")],
			["Last updated",updated || "Unknown"],
			["Running as",aboutpermissions()+", "+(typeof applist!=="undefined" && applist?applist.length:0)+" apps found"]
		]],
		["Configuration",[
			["Settings backup",backup],
			["Changed settings",changed+" of "+total+", "+aboutbytes(aboutstorage())+" stored"],
			["Your layout",pinnedids().length+" pinned, "+settings.folders.length+" folders"+(sysfolders>0?" ("+sysfolders+" from the TV)":"")+", "+settings.hidden.length+" hidden, "+Object.keys(settings.names || {}).length+" renamed"]
		]],
		["Wallpaper",[
			["Source",source],
			["Streamed videos",streamed.length+" from "+Object.keys(sources).length+" sources"],
			["Playing now",playing || "None"]
		]],
		["Screen",[
			["Resolution",aboutresolution().panel],
			["Page size",aboutresolution().page],
			["Web engine",aboutengine()]
		]],
		["TV",[
			["Model",tv===undefined?"Checking...":tv?tv.model+(String(tv.uhd)==="true"?", 4K":""):"Not available"],
			["Firmware",tv===undefined?"Checking...":tv?tv.firmware+(tv.sdk?" (SDK "+tv.sdk+")":""):"Not available"]
		]],
		["GitHub",[
			["Project","github.com/"+GITHUB_REPO],
			["Report a problem","github.com/"+GITHUB_REPO+"/issues"],
			["Latest release",aboutupdatetext()],
			["License","GNU GPL v3"],
			["Based on","QwQHome by exkc"]
		]]
	];
}

function aboutsection(title,rows) {
	const box=el("div","aboutsection");
	box.appendChild(el("div","sheading",title));
	rows.forEach((row) => {
		const line=el("div","aboutrow");
		line.appendChild(el("span","aboutlabel",row[0]));
		line.appendChild(el("span","aboutvalue",row[1]));
		box.appendChild(line);
	});
	return box;
}

function renderabout(box) {
	if(about.tv===undefined && about.backupfile===undefined){ loadaboutdata(); }
	const head=el("div","abouthead");
	const icon=el("img","abouticon");
	icon.setAttribute("src","largeIcon.png");
	icon.setAttribute("alt","");
	head.appendChild(icon);
	const title=el("div","abouttitle");
	title.appendChild(el("span","aboutname","OpenLauncher"));
	title.appendChild(el("small","aboutsub","v"+APP_RELEASE+" - a custom home screen for webOS TVs"));
	head.appendChild(title);
	const actions=el("div","aboutactions");
	actions.appendChild(optionbutton("Check for updates",false,() => checkupdates(),"download"));
	actions.appendChild(optionbutton("Refresh",false,() => {
		about.tv=undefined;
		about.backupfile=undefined;
		renderpane();
	},"reset"));
	head.appendChild(actions);
	box.appendChild(head);
	const columns=el("div","aboutcols");
	const sections=aboutsections();
	const left=el("div","aboutcol");
	const right=el("div","aboutcol");
	sections.forEach((section,index) => (index<3?left:right).appendChild(aboutsection(section[0],section[1])));
	columns.appendChild(left);
	columns.appendChild(right);
	box.appendChild(columns);
}
