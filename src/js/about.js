//SPDX-License-Identifier: WTFNMFPL
// Settings > App info: the essentials. Which version this is and updating it, the TV it runs on, what it is allowed to do,
// and where the project lives. The internet is only used when you press Check for updates.

const APP_RELEASE="2.1.0";       // must equal "version" in appinfo.json and the release tag (vX.Y.Z); set both with scripts/set-version.sh
const GITHUB_REPO="Shantil-K/OpenLauncher";
const GITHUB_API="https://api.github.com/repos/"+GITHUB_REPO+"/releases?per_page=1";   // per_page=1 of ALL releases: "latest" skips pre-releases
const ABOUT_APP_ID="com.homebrew.openlauncher";

// what has been looked up: the TV (once), and the newest release (only when you press Check for updates)
let about={tv:undefined,release:{state:"idle"}};

// what webOS itself tells a web app about the set (window.webOSSystem.deviceInfo, a JSON string)
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
	const keys={"keys":["modelName","firmwareVersion"]};
	let info=null;
	try {
		info=await (rooted?lunacallasroot:lunacall)('luna://com.webos.service.tv.systemproperty/getSystemInfo',keys);
		if(!info || info.returnValue===false || info.errorText!==undefined){ info=null; }
	} catch(e) {}
	if(info && info.modelName!==undefined){
		about.tv={model:info.modelName,firmware:info.firmwareVersion};
	} else {
		const device=webosdeviceinfo();
		about.tv=device && device.modelName?{model:device.modelName,firmware:device.version || device.platformVersion}:null;
	}
	if(settingstab==="about"){ renderpane(); }
}

function checkupdates() {
	about.release={state:"checking"};
	renderpane();
	fetch(GITHUB_API).then((response) => response.json()).then((list) => {
		const latest=Array.isArray(list)?list[0]:null;
		about.release=latest && latest.tag_name?{state:"ok",tag:latest.tag_name}:{state:"error"};
	}).catch(() => {
		about.release={state:"error"};
	}).then(() => {
		if(settingstab==="about"){ renderpane(); }
	});
}

function aboutnewer() {
	return about.release.state==="ok" && compareversions(about.release.tag,APP_RELEASE)>0;
}

// the update line: what is going on, and the one button that makes sense now
function aboutupdate(box) {
	const busy=["checking","downloading","verifying","installing","installed"].indexOf(updatestate.step)!==-1;
	let text;
	if(busy || updatestate.step==="failed"){ text=updatetext(); }
	else if(about.release.state==="checking"){ text="Checking GitHub..."; }
	else if(about.release.state==="error"){ text="Couldn't reach GitHub. Check the internet connection."; }
	else if(aboutnewer()){ text=about.release.tag+" is out."+(rooted?"":" Install it from GitHub (updating from here needs root)."); }
	else if(about.release.state==="ok"){ text="Up to date."; }
	else { text="Updates are signed and checked before they install."; }
	const line=el("div","aboutupdate");
	line.appendChild(el("span","aboutupdatetext",text));
	if(!busy && about.release.state!=="checking"){
		if(aboutnewer() && rooted){
			const update=optionbutton("Update to "+about.release.tag,false,() => installupdate(),"download");
			update.classList.add("on");
			line.appendChild(update);
		} else {
			line.appendChild(optionbutton("Check for updates",false,() => checkupdates(),"reset"));
		}
	}
	box.appendChild(line);
}

function aboutrow(box,label,value) {
	const row=el("div","aboutrow");
	row.appendChild(el("span","aboutlabel",label));
	row.appendChild(el("span","aboutvalue",value));
	box.appendChild(row);
}

function renderabout(box) {
	if(about.tv===undefined){
		about.tv=null;
		lookuptv();
	}
	const head=el("div","abouthead");
	const icon=el("img","abouticon");
	icon.setAttribute("src","largeIcon.png");
	icon.setAttribute("alt","");
	head.appendChild(icon);
	const title=el("div","abouttitle");
	title.appendChild(el("span","aboutname","OpenLauncher"));
	title.appendChild(el("small","aboutsub","Version "+APP_RELEASE));
	head.appendChild(title);
	box.appendChild(head);
	aboutupdate(box);
	const rows=el("div","aboutrows");
	const tv=about.tv;
	aboutrow(rows,"TV",tv?tv.model+(tv.firmware?", firmware "+tv.firmware:""):"Not available");
	aboutrow(rows,"Access",rooted?"Root (Homebrew Channel)":turstedapp?"Trusted app":"Limited (no root)");
	aboutrow(rows,"Project","github.com/"+GITHUB_REPO);
	aboutrow(rows,"License","GPL v3, based on QwQHome by exkc");
	box.appendChild(rows);
}
