//SPDX-License-Identifier: WTFNMFPL
// Folders in the app drawer. `settings.folders` is [{id, name}] and `settings.appfolder` maps an app id to a folder id
// (an app is in at most one folder). The drawer shows the folders first, then the apps that are in none; opening a
// folder shows just its apps. A bar above the drawer (#folderbar) has a chip for All apps and one per folder. In Edit mode an app's folder button opens the picker below.

const FOLDER_NAME_MAX=40;
const FOLDER_MAX=30;
let openfolder=null;       // id of the folder shown in the drawer, or null for the main view
let pickerapp=null;        // app the folder picker is choosing a folder for

function folderbyid(id) {
	return settings.folders.filter((folder) => folder.id===id)[0] || null;
}

function newfolderid() {
	let id;
	do {
		id="f"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);
	} while(folderbyid(id));      // two folders made in the same moment must not share an id
	return id;
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
	if(issystemfolder(id) && settings.sysdismissed.indexOf(id)===-1){ settings.sysdismissed.push(id); }     // don't make it again
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
// the apps a folder shows: the ones that exist and are visible (Edit mode also shows the hidden ones), in drawer order
function appsofview(id) {
	return orderedapps().filter((app) => settings.appfolder[app.id]===id && (editing || !ishidden(app.id)));
}

const FOLDER_PREVIEW_ICONS=4;

function makefoldertile(folder) {
	const tile=document.createElement("div");
	tile.setAttribute("class","appitem foldertile");
	const icon=document.createElement("div");
	icon.setAttribute("class","appicon foldericon");
	const name=document.createElement("p");
	name.setAttribute("class","appname");
	tile.appendChild(icon);
	tile.appendChild(name);
	tile.iconbox=icon;
	tile.namelabel=name;
	tile.previewkey=null;
	tile.addEventListener("click",() => openfolderview(tile.folderid));
	watchmarquee(tile);
	tile.folderid=folder.id;
	return tile;
}

// the drawer shows this folder's apps (null: the main list)
function openfolderview(id) {
	openfolder=id;
	render();
	appluncher.scrollTop=0;
}

// a folder tile shows a 2x2 peek at what is inside, or a folder icon while it is empty
function drawfolderpreview(tile,apps) {
	const key=apps.map((app) => app.id).join(",");
	if(tile.previewkey===key){ return; }
	tile.previewkey=key;
	tile.iconbox.innerHTML="";
	if(apps.length===0){
		tile.iconbox.innerHTML=iconsvg("folder");
		return;
	}
	const grid=document.createElement("div");
	grid.setAttribute("class","foldermini");
	apps.slice(0,FOLDER_PREVIEW_ICONS).forEach((app) => {
		const img=document.createElement("img");
		img.src=appiconsrc(app);
		if(app.iconColor!==undefined){ img.style.backgroundColor=app.iconColor; }
		img.addEventListener("error",() => { img.src=appdir+"/access/fallback.png"; });
		grid.appendChild(img);
	});
	tile.iconbox.appendChild(grid);
}

function foldertilefor(folder) {
	let tile=tilecache.folders.get(folder.id);
	if(!tile){
		tile=makefoldertile(folder);
		tilecache.folders.set(folder.id,tile);
	}
	const apps=appsofview(folder.id);
	if(tile.namelabel.innerText!==folder.name){ tile.namelabel.innerText=folder.name; }
	tile.setAttribute("title",folder.name+" ("+apps.length+")");
	drawfolderpreview(tile,apps);
	return tile;
}

// shown instead of the apps while an open folder has none
function emptyfoldernote() {
	let note=tilecache.folders.get("empty");
	if(!note){
		note=document.createElement("p");
		note.setAttribute("class","folderempty");
		note.innerText="Nothing in this folder yet. In Edit mode, use an app's folder button to move it here.";
		tilecache.folders.set("empty",note);
	}
	return note;
}

// the drawer's tiles for the current view, in order (used by render() in main.js)
function drawertilelist() {
	const shown=(app) => editing || !ishidden(app.id);
	const inthisview=(app) => openfolder===null?!settings.appfolder[app.id]:settings.appfolder[app.id]===openfolder;
	if(openfolder!==null && !folderbyid(openfolder)){ openfolder=null; }   // it was deleted (or restored from a backup without it)
	const tiles=[];
	if(openfolder===null){
		settings.folders.forEach((each) => tiles.push(foldertilefor(each)));
	}
	const apps=orderedapps().filter((app) => shown(app) && inthisview(app));
	apps.forEach((app) => tiles.push(tilefor(app,false)));
	if(openfolder!==null && apps.length===0){ tiles.push(emptyfoldernote()); }
	return tiles;
}

// ---- the bar above the drawer: All apps and one chip per folder, to switch folders without going back first
function makechip() {
	const chip=document.createElement("button");
	chip.setAttribute("class","chip");
	const icon=document.createElement("span");
	icon.setAttribute("class","chipicon");
	const label=document.createElement("span");
	label.setAttribute("class","chiplabel");
	const count=document.createElement("span");
	count.setAttribute("class","chipcount");
	chip.appendChild(icon);
	chip.appendChild(label);
	chip.appendChild(count);
	chip.labelbox=label;
	chip.countbox=count;
	chip.iconbox=icon;
	chip.addEventListener("click",() => openfolderview(chip.folderid));
	return chip;
}

function chipfor(key,id,label,icon,count) {
	let chip=tilecache.folders.get("chip:"+key);
	if(!chip){
		chip=makechip();
		chip.iconbox.innerHTML=iconsvg(icon);
		tilecache.folders.set("chip:"+key,chip);
	}
	chip.folderid=id;
	if(chip.labelbox.innerText!==label){ chip.labelbox.innerText=label; }
	const text=count===null?"":String(count);
	if(chip.countbox.innerText!==text){ chip.countbox.innerText=text; }
	chip.classList.toggle("on",openfolder===id);
	chip.setAttribute("aria-pressed",openfolder===id?"true":"false");
	return chip;
}

function renderfolderbar() {
	const any=settings.folders.length>0;
	maindiv.classList.toggle("hasfolders",any);
	if(!any){
		placetiles(folderbar,[],0);
		return;
	}
	const chips=[chipfor("all",null,"All apps","apps",null)];
	settings.folders.forEach((folder) => chips.push(chipfor(folder.id,folder.id,folder.name,"folder",appsofview(folder.id).length)));
	placetiles(folderbar,chips,0);
}

// ---- the picker: "Move to folder" for one app. A card for the main list and one per folder (a peek at what is in it, how many
// apps, a tick on the one the app is in), then a row to make a new folder: one-press suggestions, or type a name.
const FOLDER_SUGGESTIONS=["Games","Streaming","Media","Tools","Kids","Music","Sports"];
const FOLDER_SUGGESTION_COUNT=4;
const TOAST_MS=2600;
let movetoasttimer=null;

function folderpickeropen() {
	return maindiv.classList.contains("pickeropen");
}

function closefolderpicker() {
	pickerapp=null;
	maindiv.classList.remove("pickeropen");
	maindiv.classList.remove("naming");
}

// a line at the bottom of the screen that says what just happened, for a moment
function showmovetoast(text) {
	movetoast.textContent=text;
	movetoast.classList.add("on");
	clearTimeout(movetoasttimer);
	movetoasttimer=setTimeout(() => movetoast.classList.remove("on"),TOAST_MS);
}

function apptitle(appid) {
	const app=applist.filter((each) => each.id===appid)[0];
	return app?app.title:appid;
}

// move the app being edited to a folder (null: the main list) and say so
function choosefolder(folderid,created) {
	const appid=pickerapp;
	const before=settings.appfolder[appid] || null;
	const title=apptitle(appid);
	const folder=folderid?folderbyid(folderid):null;
	if(before!==folderid){
		setappfolder(appid,folderid);
		showmovetoast(created?"Made the folder "+folder.name+" and moved "+title+" to it":folder?"Moved "+title+" to "+folder.name:"Moved "+title+" back to the main list");
	}
	closefolderpicker();
}

function appsnote(count) {
	return count===0?"empty":count===1?"1 app":count+" apps";
}

// what a card shows in front: the first apps of a folder, or a picture for the main list
function cardpicture(apps,icon) {
	const box=document.createElement("span");
	box.setAttribute("class","cardpicture");
	if(icon){
		box.innerHTML=iconsvg(icon);
		return box;
	}
	if(apps.length===0){
		box.innerHTML=iconsvg("folder");
		return box;
	}
	const grid=document.createElement("span");
	grid.setAttribute("class","foldermini");
	apps.slice(0,FOLDER_PREVIEW_ICONS).forEach((app) => {
		const img=document.createElement("img");
		img.src=appiconsrc(app);
		if(app.iconColor!==undefined){ img.style.backgroundColor=app.iconColor; }
		grid.appendChild(img);
	});
	box.appendChild(grid);
	return box;
}

function foldercard(label,count,current,onclick,picture) {
	const card=document.createElement("button");
	card.setAttribute("class","sopt foldercard"+(current?" on":""));
	card.textContent=label;
	card.appendChild(picture);
	const note=document.createElement("span");
	note.setAttribute("class","cardnote");
	note.textContent=appsnote(count);
	card.appendChild(note);
	if(current){
		const tick=document.createElement("span");
		tick.setAttribute("class","cardtick");
		tick.innerHTML=iconsvg("check");
		card.appendChild(tick);
	}
	card.addEventListener("click",onclick);
	return card;
}

// names worth offering with one press: not made yet
function suggestednames() {
	const have=settings.folders.map((folder) => folder.name.toLowerCase());
	return FOLDER_SUGGESTIONS.filter((name) => have.indexOf(name.toLowerCase())===-1).slice(0,FOLDER_SUGGESTION_COUNT);
}

function namingfolder() {
	return maindiv.classList.contains("naming");
}

function togglenaming() {
	const on=!namingfolder();
	maindiv.classList.toggle("naming",on);
	foldermessage.textContent="";
	renderfolderpicker();
	if(on){
		foldernewname.value="";
		// with the remote OK on the box opens the keyboard; with the pointer it can open at once
		if(typeof keyboardmode!=="undefined" && keyboardmode){ setfocus(foldernewname); } else { foldernewname.focus(); }
	}
}

function renderfolderpicker() {
	const current=settings.appfolder[pickerapp] || null;
	const app=applist.filter((each) => each.id===pickerapp)[0];
	const now=current?folderbyid(current):null;
	folderapp.textContent=app?"Move "+app.title+" to":"Move to folder";
	foldercurrent.textContent=now?"Now in "+now.name:"Now in the main list";
	if(app){
		folderappicon.src=appiconsrc(app);
		folderappicon.onerror=() => { folderappicon.onerror=null; folderappicon.src=appdir+"/access/fallback.png"; };
	}
	folderappicon.style.display=app?"":"none";
	folderlist.innerHTML="";
	const unfiled=orderedapps().filter((each) => !settings.appfolder[each.id] && (editing || !ishidden(each.id))).length;
	folderlist.appendChild(foldercard("Main list",unfiled,current===null,() => choosefolder(null),cardpicture([],"apps")));
	settings.folders.forEach((folder) => {
		const apps=appsofview(folder.id);
		folderlist.appendChild(foldercard(folder.name,apps.length,current===folder.id,() => choosefolder(folder.id),cardpicture(apps)));
	});
	foldersuggest.innerHTML="";
	foldersuggest.appendChild(optionbutton("Type a name",namingfolder(),() => togglenaming(),"add"));
	suggestednames().forEach((name) => {
		foldersuggest.appendChild(optionbutton(name,false,() => makeandmove(name)));
	});
}

function openfolderpicker(appid) {
	pickerapp=appid;
	maindiv.classList.remove("naming");
	foldernewname.value="";
	foldermessage.textContent="";
	renderfolderpicker();
	maindiv.classList.add("pickeropen");
}

// make a folder and put the app in it
function makeandmove(name) {
	const result=createfolder(name);
	if(typeof result==="object"){
		foldermessage.textContent=result.error;
		return;
	}
	choosefolder(result,true);
}

function createfrompicker() {
	makeandmove(foldernewname.value);
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
	line.appendChild(optionbutton("Add",false,() => addfolderfromsettings(input),"add"));
	box.appendChild(line);
	if(foldersstatus){ box.appendChild(el("div","sstatus",foldersstatus)); }
	if(settings.folders.length===0){
		box.appendChild(el("div","sstatus","No folders yet. In Edit mode, an app's folder button puts it in one."));
	}
	if(systemfoldersincomplete()){
		const restore=optionbutton("Restore Inputs, TV, Settings...",false,() => {
			syncsystemfolders(true);
			foldersstatus="Put the TV's own apps back into their folders.";
			render();
			renderpane();
		},"reset");
		box.appendChild(restore);
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
