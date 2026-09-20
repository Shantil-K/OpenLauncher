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
			appfolder:appfolder
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
	savesettings();
	applyprefs();
	render();
}

// single-quote a string for the shell
function shellquote(text){
	return "'"+String(text).replace(/'/g,"'\\''")+"'";
}

async function savebackupfile(text){
	const result=await execasroot("printf '%s' "+shellquote(text)+" > "+BACKUP_FILE);
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
	buttons.appendChild(optionbutton("Export",false,() => exportbackup()));
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
		}));
	}
	if(rooted){
		buttons.appendChild(optionbutton("Load file",false,() => loadbackupfile()));
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
