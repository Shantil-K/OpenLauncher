//SPDX-License-Identifier: WTFNMFPL

let applist;
let editing=false;
const SETTINGS_KEY='openlauncher.settings';
// used until the user pins/unpins something for the first time
const DEFAULT_PINNED=["com.webos.app.livetv","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.mediadiscovery","com.famobi.ctr","com.halfbrick.fruitninja","com.github.k4zmu2a.space-cadet-pinball"];
// sysplaced / sysdismissed: see systemapps.js
let settings={pinned:null,hidden:[],order:[],folders:[],appfolder:{},sysplaced:[],sysdismissed:[]};
// hover-only reordering: rest on a tile's Move zone to pick the app up, hover other tiles to move it, rest on it to drop
const PICKUP_MS=875;
const DROP_MS=700;
let carrying=null;
let droptimer=null;
	  let noappperm=true;
	  let turstedapp=false,rooted=false;
let appid='com.homebrew.openlauncher'
let appdir='/media/developer/apps/usr/palm/applications/'+appid;

 
// Built once per app and kept (see tilecache), so changing the order, pins or hidden apps never recreates the icons.
// ---- names too long for their tile scroll sideways while the tile is hovered or has the remote's focus
const MARQUEE_SPEED=45;         // px per second
const MARQUEE_MIN_SECONDS=2.5;  // one way, pauses at both ends included
const MARQUEE_PAUSE=0.6;        // the part of the time the text actually moves (the rest is the pause at each end)

// a tile scrolls its name if it is hovered or focused and the name doesn't fit
function marqueeupdate(tile){
	const name=tile.querySelector(".appname");
	if(!name){ return; }
	if(tile.marqueehover || tile.marqueefocus){
		if(name.classList.contains("marquee")){ return; }
		const hidden=name.scrollWidth-name.clientWidth;
		if(!(hidden>1)){ return; }
		name.style.setProperty("--marquee",(-hidden)+"px");
		name.style.animationDuration=Math.max(MARQUEE_MIN_SECONDS,hidden/MARQUEE_SPEED/MARQUEE_PAUSE)+"s";
		name.classList.add("marquee");
	} else {
		name.classList.remove("marquee");
	}
}

// the remote's focus ring moved on or off a tile (dpad.js)
function marqueefocus(el,on){
	if(!el || !el.classList || !el.classList.contains("appitem")){ return; }
	el.marqueefocus=on;
	marqueeupdate(el);
}

function watchmarquee(tile){
	tile.addEventListener("mouseenter",() => { tile.marqueehover=true; marqueeupdate(tile); });
	tile.addEventListener("mouseleave",() => { tile.marqueehover=false; marqueeupdate(tile); });
}

// where an app's icon comes from (also used by the miniature icons on folder tiles)
function appiconsrc(eachapp){
	if(turstedapp){
		return eachapp.folderPath+'/'+eachapp.icon;
	} else if(rooted) {
		return 'hack/'+eachapp.folderPath+'/'+eachapp.icon;
	}
	return "/access/fallback.png";
}

// `recent`: a tile of the Recent apps row. That row is filled by itself (what you launched last), so its tiles have no edit
// controls and can't be picked up, moved or dropped on.
function maketile (eachapp,inbar,recent) {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
		appicon.src=appiconsrc(eachapp);
		appicon.setAttribute("class","appicon");
	if(!(eachapp.iconColor === undefined)) {
		appicon.style="background-color : " + eachapp.iconColor +";";
	}
		appicon.addEventListener("error", function(e){
			e.target.src=appdir+"/access/fallback.png";
		});
		appname.innerText=eachapp.title;
		appname.setAttribute("class","appname");
		appitem.setAttribute("class",recent?"appitem recenttile":"appitem");
		appitem.setAttribute("data-appid",eachapp.id);
		appitem.appendChild(appicon);
		appitem.appendChild(appname);
		// shown over the tile while hovering it in edit mode; labels and icons are filled in by updatetile()
		const appctl=document.createElement("div");
		appctl.setAttribute("class","appctl");
		if(!inbar){
			appitem.hidebtn=ctlbutton(() => togglehide(eachapp.id));
			appctl.appendChild(appitem.hidebtn);
			const folderbtn=ctlbutton(() => openfolderpicker(eachapp.id));
			setctl(folderbtn,"Move to folder","folder");
			appctl.appendChild(folderbtn);
			if(canuninstall(eachapp)){
				const trashbtn=ctlbutton(() => openuninstallquestion(appitem));
				trashbtn.classList.add("dangerctl");
				setctl(trashbtn,"Uninstall","trash");
				appctl.appendChild(trashbtn);
			} else {
				folderbtn.classList.add("wide");
			}
		}
		if(recent){
			watchmarquee(appitem);
			appitem.addEventListener("click", function(){
				if(editing){ return; }
				recordrecent(eachapp.id);
				launchapp(eachapp.id);
			});
			return appitem;
		}
		const movezone=document.createElement("div");
		movezone.setAttribute("class","movezone");
		movezone.setAttribute("title","Hover to reorder");
		movezone.setAttribute("aria-label","Hover to reorder");
		const moveicon=document.createElement("span");
		moveicon.innerHTML=iconsvg("reorder");
		movezone.appendChild(moveicon);
		let pickuptimer=null;
		movezone.addEventListener("mouseenter", function(){
			pickuptimer=setTimeout(() => startcarry(eachapp.id,inbar),PICKUP_MS);
		});
		movezone.addEventListener("mouseleave", function(){
			clearTimeout(pickuptimer);
		});
		appctl.appendChild(movezone);
		appitem.appendChild(appctl);

		watchmarquee(appitem);
		appitem.addEventListener("mouseenter", function(){
			if(!carrying){ return; }
			if(carrying.id===eachapp.id){
				if(carrying.armed && carrying.inbar===inbar){ droptimer=setTimeout(stopcarry,DROP_MS); }
			} else if(carrying.inbar===inbar){
				movecarried(eachapp.id);
			} else if(inbar){
				pincarried(eachapp.id);        // carried from the app menu onto a bar tile: pinned in its place
			} else {
				unpincarried();                // carried from the bar onto an app in the menu: unpinned, and put in its place
				movecarried(eachapp.id);
			}
		});
		appitem.addEventListener("mouseleave", function(){
			clearTimeout(droptimer);
			if(carrying && carrying.id===eachapp.id){ carrying.armed=true; }
		});

		appitem.addEventListener("click", function(){
			if(editing){ return; }
			recordrecent(eachapp.id);
			launchapp(eachapp.id);
		});
		return appitem;
	}

function launchapp(id){
	if(rooted){
		lunacallasroot('luna://com.webos.service.applicationManager/launch',{"id":id});
	} else {
		lunacall('luna://com.webos.service.applicationManager/launch',{"id":id});
	}
}

// id -> tile element, for the bar and for the drawer (an app has one tile in each)
const tilecache={bar:new Map(),drawer:new Map(),recent:new Map(),folders:new Map()};

function tilefor(app,inbar,cache){
	cache=cache || (inbar?tilecache.bar:tilecache.drawer);
	let tile=cache.get(app.id);
	if(!tile){
		tile=maketile(app,inbar,cache===tilecache.recent);
		cache.set(app.id,tile);
	}
	updatetile(tile,app.id,inbar);
	return tile;
}

// bring a kept tile in line with the current settings without recreating anything
function updatetile(tile,id,inbar){
	tile.classList.toggle("hiddenapp",ishidden(id));
	tile.classList.toggle("pinnedapp",!inbar && ispinned(id));
	tile.classList.toggle("carried",!!carrying && carrying.id===id && carrying.inbar===inbar);
	if(tile.hidebtn){ setctl(tile.hidebtn,ishidden(id)?"Show":"Hide",ishidden(id)?"eye":"eyeoff"); }
}

function setctl(btn,label,icon){
	if(btn.shownicon===icon){ return; }
	btn.shownicon=icon;
	btn.setAttribute("title",label);
	btn.setAttribute("aria-label",label);
	btn.innerHTML=iconsvg(icon);
}

// make box hold exactly these tiles in this order, touching only what changed; the first `skip` children are static
function placetiles(box,tiles,skip){
	Array.from(box.children).slice(skip).forEach((child) => {
		if(tiles.indexOf(child)===-1){ box.removeChild(child); }
	});
	tiles.forEach((tile,i) => {
		const at=box.children[skip+i];
		if(at!==tile){ box.insertBefore(tile,at||null); }
	});
}

function ctlbutton(onclick){
	const btn=document.createElement("button");
	btn.addEventListener("click", function(e){
		e.stopPropagation();
		onclick();
	});
	return btn;
}

// The TV marks the apps that are not meant to be in an app list (inputs, services, overlays, accessibility helpers...) with
// visible:false: on an LG C2 that is 134 of the 189 apps. They stay in `applist` (the bottom bar still finds Live TV and the
// HDMI inputs there) but are left out of the app menu unless "System apps" is on in the Apps settings.
function isuserapp(app){
	return app.visible!==false;
}

// the apps of the app menu in the user's saved drawer order; apps not in the saved order keep the system order after it
function orderedapps(){
	const rank={};
	settings.order.forEach((id,i) => {rank[id]=i;});
	const rankof=(app,i) => (app.id in rank)?rank[app.id]:settings.order.length+i;
	const all=prefs.showSystemApps===true;
	// an app in a folder is always listed, so the ones the launcher put into Inputs, TV... show up (see systemapps.js)
	return applist.map((app,i) => ({app,rank:rankof(app,i)})).sort((x,y) => x.rank-y.rank).map((x) => x.app).filter((app) => all || isuserapp(app) || !!settings.appfolder[app.id]);
}

// Hidden apps live at the end of the menu order. Hiding one sends it there; unhiding leaves it where it is until Edit mode
// ends (or starts again), when the apps that are shown again go before the ones that are still hidden, so the app you just
// unhid is the last one in the list.
function hiddenlast(){
	if(settings.hidden.length===0){ return; }
	const ids=orderedapps().map((app) => app.id);
	const next=ids.filter((id) => !ishidden(id)).concat(ids.filter((id) => ishidden(id)));
	if(next.join("\n")!==ids.join("\n")){
		settings.order=next;
		savesettings();
	}
}

const CARRY_HINT_MENU="Hover other apps to move it there, or hover the bottom bar to pin it. Rest on it to drop.";
const CARRY_HINT_BAR="Hover other apps to move it there, or hover the app menu to unpin it. Rest on it to drop.";

function startcarry(id,inbar){
	carrying={id,inbar,armed:false};
	carryhint.textContent=inbar?CARRY_HINT_BAR:CARRY_HINT_MENU;
	maindiv.classList.add("carrying");
	render();
}

function stopcarry(){
	clearTimeout(droptimer);
	carrying=null;
	maindiv.classList.remove("carrying");
	render();
}

// put the carried app in the position of the app being hovered (in the bar or the drawer, wherever it was picked up)
function movecarried(targetid){
	const inbar=carrying.inbar;
	const ids=inbar?pinnedids().slice():orderedapps().map((app) => app.id);
	const from=ids.indexOf(carrying.id);
	const to=ids.indexOf(targetid);
	if(from===-1 || to===-1 || from===to){ return; }
	ids.splice(from,1);
	ids.splice(to,0,carrying.id);
	if(inbar){ settings.pinned=ids; } else { settings.order=ids; }
	carrying.armed=true;
	savesettings();
	render();
}

// A carried app can cross between the app menu and the bottom bar: into the bar pins it (in the place of the tile it is
// over, or at the end), back into the menu unpins it. `carrying.inbar` says where it is now.
function pincarried(beforeid){
	const pinned=pinnedids().filter((id) => id!==carrying.id);
	const at=beforeid===null?-1:pinned.indexOf(beforeid);
	if(at===-1){ pinned.push(carrying.id); } else { pinned.splice(at,0,carrying.id); }
	settings.pinned=pinned;
	settings.hidden=settings.hidden.filter((id) => id!==carrying.id);      // a hidden app would pin into nothing
	carrying.inbar=true;
	carrying.armed=true;
	carryhint.textContent="Pinned to the bottom bar. "+CARRY_HINT_BAR;
	savesettings();
	render();
}

// the pointer entered the bottom bar (even its empty part) with an app from the menu: pin it at the end
function barhovered(){
	if(carrying && !carrying.inbar){ pincarried(null); }
}

function unpincarried(){
	settings.pinned=pinnedids().filter((id) => id!==carrying.id);
	carrying.inbar=false;
	carrying.armed=true;
	carryhint.textContent="Unpinned. "+CARRY_HINT_MENU;
	savesettings();
	render();
}

function loadsettings(){
	try {
		const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));
		if(saved){
			settings.pinned=Array.isArray(saved.pinned)?saved.pinned:null;
			settings.hidden=Array.isArray(saved.hidden)?saved.hidden:[];
			settings.order=Array.isArray(saved.order)?saved.order:[];
			settings.sysplaced=Array.isArray(saved.sysplaced)?saved.sysplaced.filter((id) => typeof id==="string"):[];
			settings.sysdismissed=Array.isArray(saved.sysdismissed)?saved.sysdismissed.filter((id) => typeof id==="string"):[];
			settings.folders=Array.isArray(saved.folders)?saved.folders.filter((f) => f && typeof f.id==="string" && typeof f.name==="string"):[];
			const known=settings.folders.map((f) => f.id);
			settings.appfolder={};
			if(saved.appfolder && typeof saved.appfolder==="object"){
				Object.keys(saved.appfolder).forEach((appid) => {
					if(known.indexOf(saved.appfolder[appid])!==-1){ settings.appfolder[appid]=saved.appfolder[appid]; }
				});
			}
		}
	} catch(e) {}
}

function savesettings(){
	try {
		localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
	} catch(e) {}
}

function pinnedids(){
	return settings.pinned===null?DEFAULT_PINNED:settings.pinned;
}

function ispinned(id){
	return pinnedids().indexOf(id)!==-1;
}

function ishidden(id){
	return settings.hidden.indexOf(id)!==-1;
}

function togglehide(id){
	const at=settings.hidden.indexOf(id);
	if(at===-1){
		settings.hidden.push(id);
		settings.order=orderedapps().map((app) => app.id).filter((each) => each!==id).concat([id]);     // to the end of the list
	} else {
		settings.hidden.splice(at,1);
	}
	savesettings();
	render();
}

function toggleedit(){
	hiddenlast();
	editing=!editing;
	closefolderpicker();
	clearTimeout(droptimer);
	carrying=null;
	maindiv.classList.remove("carrying");
	maindiv.classList.toggle("editing",editing);
	editbtn.innerText=editing?"Done":"Edit";
	render();
}

// closing the app menu ends Edit mode too (as if Done had been pressed)
function drawerchanged(){
	if(!realappbarbtu.checked && editing){ toggleedit(); }
}

async function initpermcheck(){

var permtest=await lunacall('luna://com.webos.applicationManager/listApps',{});
	                noappperm=(!(permtest.errorText===undefined));

var rootcheck=await lunacall('luna://org.webosbrew.hbchannel.service/getConfiguration',{});
	if (rootcheck.errorText===undefined){
	       rooted=rootcheck.root;
	} else {
		rooted=false;
	}

if (noappperm && rooted){
await iconhack(appdir);
}

			if (noappperm){
	if (rooted){
var applistraw=await lunacallasroot('luna://com.webos.applicationManager/listApps',{});
applist=applistraw.apps;
	} else {
		await toasty("This app required app related permission or root.This app is closing due to insufficient permission...");
		window.webOSSystem.close();
	}
}else {
applist=permtest.apps;
}

applist.some((eachapp) => {if (eachapp.id === appid) {
	appdir=eachapp.folderPath;
	turstedapp=(eachapp.trustLevel==="trusted");
}});
if (!(turstedapp || rooted )) {
		await toasty("This app required trusted trustLevel or root.Thing will break without either of those. ");
	
}
}

function render() {
	if(!applist){ return; }
	const byid={};
	applist.forEach((eachapp) => {byid[eachapp.id]=eachapp;});
	const barapps=pinnedids().filter((eachid) => byid[eachid] && !ishidden(eachid)).map((eachid) => byid[eachid]);
	placetiles(appbar,barapps.map((eachapp) => tilefor(eachapp,true)),1);   // the Apps button stays first
	placetiles(appluncher,drawertilelist(),0);
	renderfolderbar();
	renderrecent();
}

// ---- recent apps: the apps launched from here, newest first, shown as a row above the bottom bar (see the Apps settings)
const RECENT_KEY='openlauncher.recent';
const RECENT_MAX=20;
let recent=[];

function loadrecent(){
	try {
		const saved=JSON.parse(localStorage.getItem(RECENT_KEY));
		if(Array.isArray(saved)){ recent=saved.filter((id) => typeof id==="string").slice(0,RECENT_MAX); }
	} catch(e) {}
}

function recordrecent(id){
	if(id===appid){ return; }
	recent=[id].concat(recent.filter((other) => other!==id)).slice(0,RECENT_MAX);
	try {
		localStorage.setItem(RECENT_KEY,JSON.stringify(recent));
	} catch(e) {}
	renderrecent();
}

function renderrecent() {
	if(!applist){ return; }
	const byid={};
	applist.forEach((eachapp) => {byid[eachapp.id]=eachapp;});
	const apps=prefs.recentShow?recent.filter((id) => byid[id] && !ishidden(id)).slice(0,prefs.recentCount).map((id) => byid[id]):[];
	maindiv.classList.toggle("has-recent",apps.length>0);
	placetiles(recentrow,apps.map((eachapp) => tilefor(eachapp,true,tilecache.recent)),1);   // the label stays first
}

// ---- uninstalling an app (the app menu's "Uninstall", in Edit mode)
const UNINSTALL_CHECKS=6;            // how many times to look for the app to be gone...
const UNINSTALL_CHECK_MS=2000;       // ...this far apart: the TV removes it a moment after it says OK

// an app the launcher can offer to uninstall: not the launcher itself, and not one the TV says can't be removed
function canuninstall(app){
	return !!app && app.id!==appid && app.removable!==false;
}

function pause(ms){
	return new Promise((resolve) => setTimeout(resolve,ms));
}

function isinstalled(id){
	return applist.some((each) => each.id===id);
}

// drop everything the launcher remembers about an app that is gone: pin, hidden, order, folder and recent
function forgetapp(id){
	if(settings.pinned!==null){ settings.pinned=settings.pinned.filter((each) => each!==id); }
	settings.hidden=settings.hidden.filter((each) => each!==id);
	settings.order=settings.order.filter((each) => each!==id);
	const kept={};
	Object.keys(settings.appfolder).forEach((each) => { if(each!==id){ kept[each]=settings.appfolder[each]; } });
	settings.appfolder=kept;
	savesettings();
	recent=recent.filter((each) => each!==id);
	try {
		localStorage.setItem(RECENT_KEY,JSON.stringify(recent));
	} catch(e) {}
}

// asks the TV to remove the app, then waits for it to leave the app list before forgetting it
async function uninstallapp(id){
	const app=applist.filter((each) => each.id===id)[0];
	const name=app?app.title:id;
	if(!canuninstall(app)){
		toasty(id===appid?"The launcher can't uninstall itself.":name+" can't be uninstalled.");
		return false;
	}
	let result;
	try {
		result=await (rooted?lunacallasroot:lunacall)('luna://com.webos.appInstallService/remove',{"id":id,"subscribe":false});
	} catch(e) {
		result={errorText:String(e)};
	}
	if(!result || result.returnValue===false || result.errorText!==undefined){
		toasty("Couldn't uninstall "+name+((result && result.errorText)?": "+result.errorText:"."));
		return false;
	}
	toasty("Uninstalling "+name+"...");
	for(let attempt=0;attempt<UNINSTALL_CHECKS;attempt++){
		await pause(UNINSTALL_CHECK_MS);
		try {
			await reload();
		} catch(e) {}
		if(!isinstalled(id)){
			forgetapp(id);
			render();
			toasty("Uninstalled "+name+".");
			return true;
		}
	}
	toasty(name+" is still installed.");
	return false;
}

async function reload() {

	let newapplist, newapplistraw;
	if (noappperm){
newapplistraw=await lunacallasroot('luna://com.webos.applicationManager/listApps',{});

}else {
newapplistraw=await lunacall('luna://com.webos.applicationManager/listApps',{});

}
console.log(newapplistraw);
	newapplist=newapplistraw.apps;

if (!( JSON.stringify(applist) === JSON.stringify(newapplist) ) ) {
	applist=newapplist;
	syncsystemfolders();
	console.log("reinit");
tilecache.bar.clear();
tilecache.drawer.clear();
tilecache.recent.clear();
render();
}

}
async function inithomescreen() {
await initpermcheck();
loadsettings();
syncsystemfolders();
loadrecent();
editbtn.addEventListener("click",toggleedit);
realappbarbtu.addEventListener("change",drawerchanged);
appbar.addEventListener("mouseenter",barhovered);
render();

}

document.addEventListener("DOMContentLoaded",inithomescreen);

document.addEventListener("webOSRelaunch", reload );

