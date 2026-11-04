//SPDX-License-Identifier: WTFNMFPL

let applist;
let editing=false;
const SETTINGS_KEY='openlauncher.settings';
// used until the user pins/unpins something for the first time
const DEFAULT_PINNED=["com.webos.app.livetv","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.mediadiscovery","com.famobi.ctr","com.halfbrick.fruitninja","com.github.k4zmu2a.space-cadet-pinball"];
// sysplaced / sysdismissed: see systemapps.js
let settings={pinned:null,hidden:[],order:[],folders:[],appfolder:{},sysplaced:[],sysdismissed:[],names:{},icons:{}};    // names: app id -> the name you gave it; icons: app id -> the picture you gave it (a data: URL, see rename.js)
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
	if(settings.icons && settings.icons[eachapp.id]){ return settings.icons[eachapp.id]; }    // one you picked (rename.js)
	const icon=eachapp.icon||"";
	if(/^[a-z]+:/i.test(icon)){ return icon; }   // already a URL
	// some webOS versions give the icon as a full path, others relative to the app's folder
	const path=icon.startsWith('/')?icon:eachapp.folderPath+'/'+icon;
	if(turstedapp){
		return path;
	} else if(rooted) {
		return 'hack'+(path.startsWith('/')?'':'/')+path;
	}
	return appdir+"/access/fallback.png";
}

// `recent`: a tile of the Recent apps row. That row is filled by itself (what you launched last), so its tiles have no edit
// controls and can't be picked up, moved or dropped on.
function maketile (eachapp,inbar,recent) {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
		appitem.iconsrc=appiconsrc(eachapp);     // as given, to compare with later (img.src turns it into a full URL)
		appicon.src=appitem.iconsrc;
		appitem.iconimg=appicon;
		appicon.setAttribute("class","appicon");
	if(validcolor(eachapp.iconColor)) {
		appicon.style.backgroundColor=eachapp.iconColor;
	}
		appicon.addEventListener("error", function(e){
			e.target.src=appdir+"/access/fallback.png";
		});
		appname.innerText=appdisplayname(eachapp);
		appitem.namelabel=appname;
		appname.setAttribute("class","appname");
		appitem.setAttribute("class",recent?"appitem recenttile":"appitem");
		appitem.setAttribute("data-appid",eachapp.id);
		appitem.appendChild(appicon);
		appitem.appendChild(appname);
		if(recent){
			watchmarquee(appitem);
			appitem.addEventListener("click", function(){
				if(editing){ return; }
				recordrecent(eachapp.id);
				launchapp(eachapp.id);
			});
			return appitem;
		}
		// the Edit-mode controls are made the first time Edit mode shows this tile (see addcontrols): most tiles never need them,
		// and making them for every app made the first start noticeably slower
		appitem.makecontrols=() => addcontrols(appitem,eachapp,inbar);

		watchmarquee(appitem);
		appitem.addEventListener("mouseenter", function(){
			if(!carrying){ return; }
			if(carrying.id===eachapp.id){
				if(carrying.armed && carrying.inbar===inbar){ droptimer=setTimeout(stopcarry,DROP_MS); }
			} else if(carrying.inbar===inbar){
				movecarried(eachapp.id);
			} else if(inbar){
				pincarried(eachapp.id);        // carried from the app menu onto a bar tile: pinned in its place
			}
			// carried from the bar over an app in the menu: nothing. Pinning is a one-way trip; an app leaves the bar only
			// with the bar's own Unpin button (Edit mode)
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

// the buttons that cover a tile while hovering it in Edit mode (hide, folder, uninstall, unpin, the Move zone)
function addcontrols(tile,eachapp,inbar){
	if(tile.appctl){ return; }
	// labels and icons are filled in by updatetile()
	const appctl=document.createElement("div");
	appctl.setAttribute("class","appctl");
	if(!inbar){
		tile.hidebtn=ctlbutton(() => togglehide(eachapp.id));
		appctl.appendChild(tile.hidebtn);
		const folderbtn=ctlbutton(() => openfolderpicker(eachapp.id));
		setctl(folderbtn,"Move to folder","folder");
		appctl.appendChild(folderbtn);
		// names and icons are changed in Settings > Apps > Names and icons
		if(canuninstall(eachapp)){
			const trashbtn=ctlbutton(() => openuninstallquestion(tile));
			trashbtn.classList.add("dangerctl","wide");
			setctl(trashbtn,"Uninstall","trash");
			appctl.appendChild(trashbtn);
		}
	}
	if(inbar){
		// only the bottom bar has this: the app menu pins by carrying an app onto the bar (see pincarried)
		const unpinbtn=ctlbutton(() => unpinapp(eachapp.id));
		unpinbtn.classList.add("wide");
		setctl(unpinbtn,"Unpin","unpin");
		appctl.appendChild(unpinbtn);
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
	tile.appendChild(appctl);
	tile.appctl=appctl;
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
	updatetile(tile,app.id,inbar,app);
	return tile;
}

// bring a kept tile in line with the current settings without recreating anything
function updatetile(tile,id,inbar,app){
	if(app && tile.namelabel){
		const shown=appdisplayname(app);
		if(tile.namelabel.innerText!==shown){ tile.namelabel.innerText=shown; }
	}
	if(app && tile.iconimg){
		const icon=appiconsrc(app);
		if(tile.iconsrc!==icon){
			tile.iconsrc=icon;
			tile.iconimg.src=icon;
		}
	}
	tile.classList.toggle("hiddenapp",ishidden(id));
	tile.classList.toggle("pinnedapp",!inbar && ispinned(id));
	tile.classList.toggle("carried",!!carrying && carrying.id===id && carrying.inbar===inbar);
	if(editing && tile.makecontrols){ tile.makecontrols(); }
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
// ---- the name an app is shown with: the one you gave it (Edit mode, Rename), or the TV's
const APP_NAME_MAX=40;

function appdisplayname(app){
	return (settings.names && settings.names[app.id]) || app.title;
}

// "" (or the TV's own name) goes back to the original
function setappname(id,name){
	const app=applist.filter((each) => each.id===id)[0];
	const clean=String(name).trim().slice(0,APP_NAME_MAX);
	const next=Object.assign({},settings.names);
	if(clean==="" || (app && clean===app.title)){ delete next[id]; } else { next[id]=clean; }
	settings.names=next;
	savesettings();
	render();
}

// an app's iconColor comes from its own appinfo.json: only a plain colour is used, never other CSS
function validcolor(value){
	return typeof value==="string" && /^(#[0-9a-f]{3,8}|[a-z]{3,20}|rgba?\([0-9.,%\s]{5,40}\))$/i.test(value);
}

// ---- the icon an app is shown with: one you picked (Edit mode, Name and icon), or the TV's
const ICON_MAX_CHARS=200000;     // a saved icon is a small picture (see ICON_SIZE in rename.js); anything bigger is not one of ours

function validicon(value){
	return typeof value==="string" && value.length<=ICON_MAX_CHARS && /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(value);
}

function cleanicons(icons){
	const clean={};
	if(icons && typeof icons==="object"){
		Object.keys(icons).forEach((id) => { if(validicon(icons[id])){ clean[id]=icons[id]; } });
	}
	return clean;
}

// null (or "") goes back to the TV's own icon
function setappicon(id,icon){
	const next=Object.assign({},settings.icons);
	if(icon && validicon(icon)){ next[id]=icon; } else { delete next[id]; }
	settings.icons=next;
	savesettings();
	render();
}

function isuserapp(app){
	return app.visible!==false;
}

// the apps of the app menu in the user's saved drawer order; apps not in the saved order keep the system order after it
function orderedapps(){
	const rank={};
	settings.order.forEach((id,i) => {rank[id]=i;});
	const rankof=(app,i) => (app.id in rank)?rank[app.id]:settings.order.length+i;
	const all=prefs.showSystemApps===true;
	// the launcher's own tile isn't listed: its info is in Settings > App info. "Hide pinned apps" leaves out the ones on the
	// bottom bar, except while editing (then they are needed to move, rename or hide them)
	// an app in a folder is always listed, so the ones the launcher put into Inputs, TV... show up (see systemapps.js)
	return applist.map((app,i) => ({app,rank:rankof(app,i)})).sort((x,y) => x.rank-y.rank).map((x) => x.app).filter((app) => app.id!==appid && (all || isuserapp(app) || !!settings.appfolder[app.id]) && !(prefs.hidePinned===true && !editing && ispinned(app.id)));
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
const CARRY_HINT_BAR="Hover other apps in the bar to move it there. To take it off the bar, drop it and use its Unpin button. Rest on it to drop.";

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

// A carried app can go from the app menu into the bottom bar, and that pins it (in the place of the tile it is over, or at the
// end). It cannot go back: only the Unpin button of a bar tile (Edit mode) takes an app off the bar. `carrying.inbar` says
// where it is now.
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

// the Unpin button of a bottom bar tile (and "Unpin from the bar" in its OK menu)
function unpinapp(id){
	settings.pinned=pinnedids().filter((each) => each!==id);
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
			settings.names={};
			if(saved.names && typeof saved.names==="object"){
				Object.keys(saved.names).forEach((id) => {
					const name=typeof saved.names[id]==="string"?saved.names[id].trim().slice(0,APP_NAME_MAX):"";
					if(name!==""){ settings.names[id]=name; }
				});
			}
			settings.icons=cleanicons(saved.icons);
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

// ---- starting fast: the app list (and whether we're rooted or trusted) from the last run is saved, so the next start draws
// the bar and the menu from it at once. The TV is then asked again, and anything that changed is drawn when the answers come.
// Only the fields the launcher reads are kept: the full list is about 200 KB, this is a fraction of it.
const APPCACHE_KEY='openlauncher.appcache';
const APPCACHE_VERSION=1;
const APP_FIELDS=["id","title","icon","folderPath","iconColor","visible","removable","trustLevel","version","installTime"];

function trimapps(list){
	return (Array.isArray(list)?list:[]).filter((app) => app && typeof app.id==="string").map((app) => {
		const trimmed={};
		APP_FIELDS.forEach((field) => { if(app[field]!==undefined){ trimmed[field]=app[field]; } });
		return trimmed;
	});
}

function readappcache(){
	try {
		const saved=JSON.parse(localStorage.getItem(APPCACHE_KEY));
		if(saved && saved.v===APPCACHE_VERSION && Array.isArray(saved.apps) && saved.apps.length>0){ return saved; }
	} catch(e) {}
	return null;
}

function saveappcache(){
	try {
		localStorage.setItem(APPCACHE_KEY,JSON.stringify({v:APPCACHE_VERSION,rooted:rooted,trusted:turstedapp,noappperm:noappperm,appdir:appdir,apps:applist}));
	} catch(e) {}
}

// what the last run found: used until the TV has answered
function usecache(cache){
	rooted=cache.rooted===true;
	turstedapp=cache.trusted===true;
	noappperm=cache.noappperm!==false;
	if(typeof cache.appdir==="string" && cache.appdir!==""){ appdir=cache.appdir; }
	applist=cache.apps;
}

// Asks the TV for the app list and our permissions. Returns the trimmed app list, or null when the launcher can't work
// here (it closes itself then).
async function initpermcheck(){

var permtest=await lunacall('luna://com.webos.applicationManager/listApps',{});
	                noappperm=(!(permtest.errorText===undefined));

var rootcheck=await lunacall('luna://org.webosbrew.hbchannel.service/getConfiguration',{});
	if (rootcheck.errorText===undefined){
	       rooted=rootcheck.root===true;
	} else {
		rooted=false;
	}

let fresh;
			if (noappperm){
	if (rooted){
var applistraw=await lunacallasroot('luna://com.webos.applicationManager/listApps',{});
fresh=applistraw.apps;
	} else {
		await toasty("This app required app related permission or root.This app is closing due to insufficient permission...");
		window.webOSSystem.close();
		return null;
	}
}else {
fresh=permtest.apps;
}

fresh=trimapps(fresh);
fresh.some((eachapp) => {if (eachapp.id === appid) {
	appdir=eachapp.folderPath;
	turstedapp=(eachapp.trustLevel==="trusted");
}});
// an untrusted app can't load files outside its own folder, so icons go through a link to / inside it (see appiconsrc).
// Made whenever we're rooted and not trusted: on webOS 5 listApps works without root, but the icons still need the link.
if (rooted && !turstedapp){
	await iconhack(appdir);
}
if (!(turstedapp || rooted )) {
		await toasty("This app required trusted trustLevel or root.Thing will break without either of those. ");
	
}
return fresh;
}

let drawerlater=false;     // the first start draws the bottom bar first and the (hidden) app menu a moment later

function render() {
	if(!applist){ return; }
	const byid={};
	applist.forEach((eachapp) => {byid[eachapp.id]=eachapp;});
	const barapps=pinnedids().filter((eachid) => byid[eachid] && !ishidden(eachid)).map((eachid) => byid[eachid]);
	placetiles(appbar,barapps.map((eachapp) => tilefor(eachapp,true)),1);   // the Apps button stays first
	renderrecent();
	if(drawerlater){ return; }
	placetiles(appluncher,drawertilelist(),0);
	renderfolderbar();
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
	if(settings.names && settings.names[id]!==undefined){
		const names=Object.assign({},settings.names);
		delete names[id];
		settings.names=names;
	}
	if(settings.icons && settings.icons[id]!==undefined){
		const icons=Object.assign({},settings.icons);
		delete icons[id];
		settings.icons=icons;
	}
	savesettings();
	recent=recent.filter((each) => each!==id);
	try {
		localStorage.setItem(RECENT_KEY,JSON.stringify(recent));
	} catch(e) {}
}

// asks the TV to remove the app, then waits for it to leave the app list before forgetting it
async function uninstallapp(id){
	const app=applist.filter((each) => each.id===id)[0];
	const name=app?appdisplayname(app):id;
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

	let newapplistraw;
	if (noappperm){
newapplistraw=await lunacallasroot('luna://com.webos.applicationManager/listApps',{});

}else {
newapplistraw=await lunacall('luna://com.webos.applicationManager/listApps',{});

}
	if(!newapplistraw || !Array.isArray(newapplistraw.apps)){ return; }
	setapplist(trimapps(newapplistraw.apps));
}

// a new app list from the TV: redraw only when something in it changed
function setapplist(newapplist){
if (!( JSON.stringify(applist) === JSON.stringify(newapplist) ) ) {
	applist=newapplist;
	syncsystemfolders();
tilecache.bar.clear();
tilecache.drawer.clear();
tilecache.recent.clear();
render();
}
saveappcache();
}

let homestarted=false;    // the screen has been drawn once (from the saved list, or from the TV's answer)

function starthome(){
	if(homestarted){ return; }
	homestarted=true;
	syncsystemfolders();
	// what is on screen first: the bottom bar. The app menu is hidden until the Apps button opens it, and making its tiles is
	// most of the work, so that waits until the bar has been shown
	drawerlater=!realappbarbtu.checked;
	render();
	try { performance.mark("openlauncher-drawn"); } catch(e) {}     // how long the start took (Performance panel, or the inspector)
	if(drawerlater){
		requestAnimationFrame(() => setTimeout(() => {
			drawerlater=false;
			render();
		},0));
	}
	if(rooted){
		detecthomemethod();   // Settings > TV > webOS version: get this ready before Settings is ever opened
	}
	if(typeof onlaunchersettled==="function"){ onlaunchersettled(); }
}

async function inithomescreen() {
loadsettings();
loadrecent();
editbtn.addEventListener("click",toggleedit);
realappbarbtu.addEventListener("change",drawerchanged);
appbar.addEventListener("mouseenter",barhovered);
const cache=readappcache();
if(cache){
	usecache(cache);
	starthome();         // drawn now, from the last run
}
let fresh=null;
try {
	fresh=await initpermcheck();
} catch(e) {}
if(fresh===null){ return; }     // the TV didn't answer (or the launcher is closing): keep what is shown
if(!cache){
	applist=fresh;
	saveappcache();
	starthome();
	return;
}
const changed=cache.rooted!==rooted || cache.trusted!==turstedapp;
setapplist(fresh);
if(changed){
	// icon paths and the Settings rows that need root depend on these
	tilecache.bar.clear();
	tilecache.drawer.clear();
	tilecache.recent.clear();
	applyprefs();
	if(rooted){ detecthomemethod(); }
}

}

document.addEventListener("DOMContentLoaded",inithomescreen);

document.addEventListener("webOSRelaunch", reload );

