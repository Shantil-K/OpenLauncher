//SPDX-License-Identifier: WTFNMFPL
// Backup: export and import the launcher's settings (the `prefs` from settings.js and the pins/hidden/order/folders in
// `settings`) as one JSON document. With root the document is also written to / read from BACKUP_FILE; without root the
// JSON is shown in a text box to copy out, and text pasted into it can be imported.

const BACKUP_FILE='/media/developer/openlauncher-settings.json';
const BACKUP_VERSION=1;

let backuptext="";
let backupmessage="";

function makebackup(){
	return JSON.stringify({app:"OpenLauncher",version:BACKUP_VERSION,prefs:changedprefs(),layout:settings},null,1);
}

function cleanstrings(list){
	return Array.isArray(list)?list.filter((x) => typeof x==="string"):null;
}

// the names you gave apps: only non-empty strings, cut to the length the launcher allows
function cleannames(names){
	const clean={};
	if(names && typeof names==="object"){
		Object.keys(names).forEach((id) => {
			const name=typeof names[id]==="string"?names[id].trim().slice(0,APP_NAME_MAX):"";
			if(name!==""){ clean[id]=name; }
		});
	}
	return clean;
}

// Check a backup document. Returns {error} or {prefs, layout, count}; anything the current schema doesn't offer is dropped.
function parsebackup(text){
	let data;
	try {
		data=JSON.parse(text);
	} catch(e) {
		return {error:"That isn't valid JSON."};
	}
	if(!data || data.app!=="OpenLauncher"){
		return {error:"That isn't an OpenLauncher backup."};
	}
	if(!(data.version<=BACKUP_VERSION)){
		return {error:"This backup is from a newer version of the launcher."};
	}
	if(data.prefs){ data.prefs=migrateprefs(data.prefs); }
	const restored={};
	let count=0;
	SETTINGS_SCHEMA.forEach((section) => section.items.forEach((item) => {
		if(item.key && data.prefs && (item.key in data.prefs) && validpref(item,data.prefs[item.key])){
			restored[item.key]=data.prefs[item.key];
			count++;
		}
	}));
	const saved=data.layout || {};
	const folders=Array.isArray(saved.folders)?saved.folders.filter((f) => f && typeof f.id==="string" && typeof f.name==="string").map((f) => ({id:f.id,name:f.name.slice(0,40)})):[];
	const folderids=folders.map((f) => f.id);
	const appfolder={};
	if(saved.appfolder && typeof saved.appfolder==="object"){
		Object.keys(saved.appfolder).forEach((appid) => {
			if(typeof saved.appfolder[appid]==="string" && folderids.indexOf(saved.appfolder[appid])!==-1){ appfolder[appid]=saved.appfolder[appid]; }
		});
	}
	return {
		prefs:restored,
		count:count,
		layout:{
			pinned:saved.pinned===null?null:cleanstrings(saved.pinned),
			hidden:cleanstrings(saved.hidden) || [],
			order:cleanstrings(saved.order) || [],
			folders:folders,
			appfolder:appfolder,
			names:cleannames(saved.names),
			icons:cleanicons(saved.icons),
			sysplaced:cleanstrings(saved.sysplaced) || [],
			sysdismissed:cleanstrings(saved.sysdismissed) || []
		}
	};
}

function applybackup(parsed){
	prefs=Object.assign({},PREF_DEFAULTS,parsed.prefs);
	saveprefs();
	settings.pinned=parsed.layout.pinned;
	settings.hidden=parsed.layout.hidden;
	settings.order=parsed.layout.order;
	settings.folders=parsed.layout.folders;
	settings.appfolder=parsed.layout.appfolder;
	settings.names=parsed.layout.names;
	settings.icons=parsed.layout.icons;
	settings.sysplaced=parsed.layout.sysplaced;
	settings.sysdismissed=parsed.layout.sysdismissed;
	savesettings();
	applyprefs();
	render();
}

// single-quote a string for the shell
function shellquote(text){
	return "'"+String(text).replace(/'/g,"'\\''")+"'";
}

// The text goes to the shell as one argument, and Linux allows at most 128 KB per argument. Custom icons can make a backup
// bigger than that, so it is written in pieces: the first one replaces the file, the rest are added to it.
const BACKUP_PIECE=60000;

async function savebackupfile(text){
	const pieces=[];
	for(let at=0;at<text.length;at+=BACKUP_PIECE){ pieces.push(text.slice(at,at+BACKUP_PIECE)); }
	if(pieces.length===0){ pieces.push(""); }
	// /media/developer is writable by every app on the TV, so the file being written gets a new random name (mktemp), never
	// a fixed one something else could have put there first
	const made=await execasroot("mktemp /media/developer/.openlauncher-backup.XXXXXX");
	const temp=String((made && made.stdoutString) || "").trim();
	if(!/^\/media\/developer\/\.openlauncher-backup\.[A-Za-z0-9]+$/.test(temp)){ return false; }
	for(let i=0;i<pieces.length;i++){
		const result=await execasroot("printf '%s' "+shellquote(pieces[i])+(i===0?" > ":" >> ")+temp);
		if(!result || result.returnValue===false || result.errorText || result.exitCode){
			execasroot("rm -f "+temp);
			return false;
		}
	}
	// only a complete file replaces the old backup
	const result=await execasroot("mv -f "+temp+" "+BACKUP_FILE);
	return !!result && result.returnValue!==false && !result.errorText && !result.exitCode;
}

async function readbackupfile(){
	const result=await execasroot("cat "+BACKUP_FILE);
	if(!result || result.returnValue===false || result.errorText || result.exitCode){ return null; }
	return result.stdoutString || null;
}

async function exportbackup(){
	backuptext=makebackup();
	backupmessage="Backup created. Copy the text below and keep it somewhere safe.";
	if(rooted){
		let saved=false;
		try { saved=await savebackupfile(backuptext); } catch(e) {}
		backupmessage=saved?"Saved to "+BACKUP_FILE+". The same text is below.":"Couldn't write "+BACKUP_FILE+". The backup text is below.";
	}
	renderpane();
}

async function loadbackupfile(){
	let text=null;
	try { text=await readbackupfile(); } catch(e) {}
	if(text===null){
		backupmessage="No backup found at "+BACKUP_FILE+".";
	} else {
		backuptext=text;
		backupmessage="Loaded "+BACKUP_FILE+". Press Import to use it.";
	}
	renderpane();
}

function importbackup(){
	const parsed=parsebackup(backuptext);
	if(parsed.error){
		backupmessage=parsed.error;
	} else {
		applybackup(parsed);
		backupmessage="Imported "+parsed.count+" setting"+(parsed.count===1?"":"s")+" and your app layout.";
	}
	confirming=null;
	renderpane();
}

// the Backup tab's row (see the "custom" item type in settings.js)
function renderbackup(box,item){
	const buttons=el("div","scontrol");
	buttons.appendChild(optionbutton("Export",false,() => exportbackup(),"download"));
	if(confirming===item){
		buttons.appendChild(el("span","sconfirm","Replace all current settings?"));
		const yes=optionbutton("Yes, replace",false,() => importbackup());
		yes.classList.add("danger");
		buttons.appendChild(yes);
		buttons.appendChild(optionbutton("Cancel",false,() => {
			confirming=null;
			renderpane();
		}));
	} else {
		buttons.appendChild(optionbutton("Import",false,() => {
			confirming=item;
			renderpane();
		},"upload"));
	}
	if(rooted){
		buttons.appendChild(optionbutton("Load file",false,() => loadbackupfile(),"open"));
	}
	box.appendChild(buttons);
	const area=el("textarea","sarea");
	area.value=backuptext;
	area.setAttribute("spellcheck","false");
	area.setAttribute("placeholder","Press Export to see your backup here, or paste one and press Import.");
	area.addEventListener("input",() => {backuptext=area.value;});
	box.appendChild(area);
	if(backupmessage){ box.appendChild(el("div","sstatus",backupmessage)); }
}
