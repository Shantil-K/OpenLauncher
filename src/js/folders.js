//SPDX-License-Identifier: WTFNMFPL
// Folders in the app drawer. `settings.folders` is [{id, name}] and `settings.appfolder` maps an app id to a folder id
// (an app is in at most one folder). The drawer shows the folders first, then the apps that are in none; opening a
// folder shows just its apps, with a Back tile. In Edit mode an app's folder button opens the picker below.

const FOLDER_NAME_MAX=40;
const FOLDER_MAX=30;
let openfolder=null;       // id of the folder shown in the drawer, or null for the main view
let pickerapp=null;        // app the folder picker is choosing a folder for

function folderbyid(id) {
	return settings.folders.filter((folder) => folder.id===id)[0] || null;
}

function newfolderid() {
	return "f"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);
}

// trimmed name, or an {error} for something we won't accept
function checkfoldername(name,ignoreid) {
	const clean=String(name).trim().slice(0,FOLDER_NAME_MAX);
	if(clean===""){ return {error:"Type a name first."}; }
	if(settings.folders.some((folder) => folder.id!==ignoreid && folder.name.toLowerCase()===clean.toLowerCase())){
		return {error:"There is already a folder with that name."};
	}
	return {name:clean};
}

// returns the new folder's id, or {error}
function createfolder(name) {
	if(settings.folders.length>=FOLDER_MAX){ return {error:"You can have up to "+FOLDER_MAX+" folders."}; }
	const checked=checkfoldername(name);
	if(checked.error){ return checked; }
	const folder={id:newfolderid(),name:checked.name};
	settings.folders=settings.folders.concat([folder]);
	savesettings();
	render();
	return folder.id;
}

function renamefolder(id,name) {
	const checked=checkfoldername(name,id);
	if(checked.error){ return checked; }
	settings.folders=settings.folders.map((folder) => folder.id===id?{id:id,name:checked.name}:folder);
	savesettings();
	render();
	return {name:checked.name};
}

// its apps go back to the main list
function deletefolder(id) {
	settings.folders=settings.folders.filter((folder) => folder.id!==id);
	const kept={};
	Object.keys(settings.appfolder).forEach((appid) => {
		if(settings.appfolder[appid]!==id){ kept[appid]=settings.appfolder[appid]; }
	});
	settings.appfolder=kept;
	if(openfolder===id){ openfolder=null; }
	savesettings();
	render();
}

function setappfolder(appid,folderid) {
	const next=Object.assign({},settings.appfolder);
	if(folderid){ next[appid]=folderid; } else { delete next[appid]; }
	settings.appfolder=next;
	savesettings();
	render();
}

function appsinfolder(id) {
	return Object.keys(settings.appfolder).filter((appid) => settings.appfolder[appid]===id).length;
}

// ---- tiles for the drawer
function makefoldertile(folder) {
	const tile=document.createElement("div");
	tile.setAttribute("class","appitem foldertile");
	const icon=document.createElement("div");
	icon.setAttribute("class","appicon foldericon");
	icon.innerHTML=iconsvg("folder");
	const name=document.createElement("p");
	name.setAttribute("class","appname");
	tile.appendChild(icon);
	tile.appendChild(name);
	tile.namelabel=name;
	tile.addEventListener("click",() => {
		openfolder=tile.folderid;
		render();
		appluncher.scrollTop=0;
	});
	tile.folderid=folder.id;
	return tile;
}

function makebacktile() {
	const tile=document.createElement("div");
	tile.setAttribute("class","appitem foldertile backtile");
	tile.setAttribute("title","Back");
	const icon=document.createElement("div");
	icon.setAttribute("class","appicon foldericon");
	icon.innerHTML=iconsvg("back");
	const name=document.createElement("p");
	name.setAttribute("class","appname");
	tile.appendChild(icon);
	tile.appendChild(name);
	tile.namelabel=name;
	tile.addEventListener("click",() => {
		openfolder=null;
		render();
		appluncher.scrollTop=0;
	});
	return tile;
}

function foldertilefor(folder) {
	let tile=tilecache.folders.get(folder.id);
	if(!tile){
		tile=makefoldertile(folder);
		tilecache.folders.set(folder.id,tile);
	}
	if(tile.namelabel.innerText!==folder.name){ tile.namelabel.innerText=folder.name; }
	tile.setAttribute("title",folder.name+" ("+appsinfolder(folder.id)+")");
	return tile;
}

// the drawer's tiles for the current view, in order (used by render() in main.js)
function drawertilelist() {
	const shown=(app) => editing || !ishidden(app.id);
	const inthisview=(app) => openfolder===null?!settings.appfolder[app.id]:settings.appfolder[app.id]===openfolder;
	const folder=openfolder===null?null:folderbyid(openfolder);
	if(openfolder!==null && !folder){ openfolder=null; }   // it was deleted (or restored from a backup without it)
	const tiles=[];
	if(folder){
		let back=tilecache.folders.get("back");
		if(!back){
			back=makebacktile();
			tilecache.folders.set("back",back);
		}
		back.namelabel.innerText=folder.name;
		tiles.push(back);
	} else {
		settings.folders.forEach((each) => tiles.push(foldertilefor(each)));
	}
	orderedapps().filter((app) => shown(app) && inthisview(app)).forEach((app) => tiles.push(tilefor(app,false)));
	return tiles;
}

// ---- the picker: "Move to folder" for one app
function folderpickeropen() {
	return maindiv.classList.contains("pickeropen");
}

function closefolderpicker() {
	pickerapp=null;
	maindiv.classList.remove("pickeropen");
}

function choosefolder(folderid) {
	setappfolder(pickerapp,folderid);
	closefolderpicker();
}

function renderfolderpicker() {
	const current=settings.appfolder[pickerapp] || null;
	const app=applist.filter((each) => each.id===pickerapp)[0];
	folderapp.textContent=app?"Move "+app.title+" to":"Move to folder";
	folderlist.innerHTML="";
	folderlist.appendChild(optionbutton("No folder",current===null,() => choosefolder(null)));
	settings.folders.forEach((folder) => {
		folderlist.appendChild(optionbutton(folder.name,current===folder.id,() => choosefolder(folder.id)));
	});
}

function openfolderpicker(appid) {
	pickerapp=appid;
	foldernewname.value="";
	foldermessage.textContent="";
	renderfolderpicker();
	maindiv.classList.add("pickeropen");
}

function createfrompicker() {
	const result=createfolder(foldernewname.value);
	if(typeof result==="object"){
		foldermessage.textContent=result.error;
		return;
	}
	choosefolder(result);
}

// ---- settings row: manage the folders (a "custom" item in settings.js)
let foldersstatus="";

function addfolderfromsettings(input) {
	const result=createfolder(input.value);
	if(typeof result==="object"){
		foldersstatus=result.error;
	} else {
		input.value="";
		foldersstatus="Added.";
	}
	renderpane();
}

function renderfolderlist(box) {
	const line=el("div","scontrol");
	const input=el("input","stext");
	input.setAttribute("type","text");
	input.setAttribute("placeholder","New folder name");
	input.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ addfolderfromsettings(input); }
	});
	line.appendChild(input);
	line.appendChild(optionbutton("Add",false,() => addfolderfromsettings(input)));
	box.appendChild(line);
	if(foldersstatus){ box.appendChild(el("div","sstatus",foldersstatus)); }
	if(settings.folders.length===0){
		box.appendChild(el("div","sstatus","No folders yet. In Edit mode, an app's folder button puts it in one."));
	}
	settings.folders.forEach((folder) => {
		const row=el("div","listrow");
		const name=el("input","stext listinput");
		name.setAttribute("type","text");
		name.value=folder.name;
		const commit=() => {
			if(name.value.trim()===folder.name){ return; }
			const result=renamefolder(folder.id,name.value);
			foldersstatus=result.error || "Renamed.";
			renderpane();
		};
		name.addEventListener("change",commit);
		name.addEventListener("keydown",(event) => {
			if(event.keyCode===13){ commit(); }
		});
		row.appendChild(name);
		row.appendChild(el("span","listkind",appsinfolder(folder.id)+" apps"));
		const remove=el("button","sopt listremove");
		remove.innerHTML=iconsvg("close");
		remove.setAttribute("title","Delete this folder (its apps go back to the main list)");
		remove.setAttribute("aria-label","Delete "+folder.name);
		remove.addEventListener("click",() => {
			deletefolder(folder.id);
			foldersstatus="Deleted "+folder.name+".";
			renderpane();
		});
		row.appendChild(remove);
		box.appendChild(row);
	});
}

function initfolders() {
	folderclose.innerHTML=iconsvg("close");
	folderclose.addEventListener("click",closefolderpicker);
	folderbackdrop.addEventListener("click",closefolderpicker);
	foldernewbtn.addEventListener("click",createfrompicker);
	foldernewname.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ createfrompicker(); }
	});
	// leaving the drawer goes back to the main view
	realappbarbtu.addEventListener("change",() => {
		if(!realappbarbtu.checked){
			closefolderpicker();
			if(openfolder!==null){
				openfolder=null;
				render();
			}
		}
	});
}

document.addEventListener("DOMContentLoaded",initfolders);
