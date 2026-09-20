//SPDX-License-Identifier: WTFNMFPL

let applist;
let editing=false;
const SETTINGS_KEY='openlauncher.settings';
// used until the user pins/unpins something for the first time
const DEFAULT_PINNED=["com.webos.app.livetv","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.mediadiscovery","com.famobi.ctr","com.halfbrick.fruitninja","com.github.k4zmu2a.space-cadet-pinball"];
let settings={pinned:null,hidden:[],order:[]};
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
function maketile (eachapp,inbar) {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
			if(turstedapp){
		appicon.src=eachapp.folderPath+'/'+eachapp.icon;
			} else if(rooted) {
		appicon.src='hack/'+eachapp.folderPath+'/'+eachapp.icon;
			}else{
appicon.src="/access/fallback.png";
			}
			
		appicon.setAttribute("class","appicon");
	if(!(eachapp.iconColor === undefined)) {
		appicon.style="background-color : " + eachapp.iconColor +";";
	}
		appicon.addEventListener("error", function(e){
			e.target.src=appdir+"/access/fallback.png";
		});
		appname.innerText=eachapp.title;
		appname.setAttribute("class","appname");
		appitem.setAttribute("class","appitem");
		appitem.setAttribute("data-appid",eachapp.id);
		appitem.appendChild(appicon);
		appitem.appendChild(appname);
		// shown over the tile while hovering it in edit mode; labels and icons are filled in by updatetile()
		const appctl=document.createElement("div");
		appctl.setAttribute("class","appctl");
		appitem.pinbtn=ctlbutton(() => togglepin(eachapp.id));
		if(inbar){ appitem.pinbtn.classList.add("wide"); }
		appctl.appendChild(appitem.pinbtn);
		if(!inbar){
			appitem.hidebtn=ctlbutton(() => togglehide(eachapp.id));
			appctl.appendChild(appitem.hidebtn);
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

		appitem.addEventListener("mouseenter", function(){
			if(!carrying || carrying.inbar!==inbar){ return; }
			if(carrying.id!==eachapp.id){
				movecarried(eachapp.id);
			} else if(carrying.armed){
				droptimer=setTimeout(stopcarry,DROP_MS);
			}
		});
		appitem.addEventListener("mouseleave", function(){
			clearTimeout(droptimer);
			if(carrying && carrying.id===eachapp.id){ carrying.armed=true; }
		});

		appitem.addEventListener("click", function(){
			if(editing){ return; }
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
const tilecache={bar:new Map(),drawer:new Map()};

function tilefor(app,inbar){
	const cache=inbar?tilecache.bar:tilecache.drawer;
	let tile=cache.get(app.id);
	if(!tile){
		tile=maketile(app,inbar);
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
	setctl(tile.pinbtn,ispinned(id)?"Unpin":"Pin",ispinned(id)?"unpin":"pin");
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

// applist in the user's saved drawer order; apps not in the saved order keep the system order after it
function orderedapps(){
	const rank={};
	settings.order.forEach((id,i) => {rank[id]=i;});
	const rankof=(app,i) => (app.id in rank)?rank[app.id]:settings.order.length+i;
	return applist.map((app,i) => ({app,rank:rankof(app,i)})).sort((x,y) => x.rank-y.rank).map((x) => x.app);
}

function startcarry(id,inbar){
	carrying={id,inbar,armed:false};
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

function loadsettings(){
	try {
		const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));
		if(saved){
			settings.pinned=Array.isArray(saved.pinned)?saved.pinned:null;
			settings.hidden=Array.isArray(saved.hidden)?saved.hidden:[];
			settings.order=Array.isArray(saved.order)?saved.order:[];
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

function togglepin(id){
	const pinned=pinnedids().slice();
	const at=pinned.indexOf(id);
	if(at===-1){
		pinned.push(id);
	} else {
		pinned.splice(at,1);
	}
	settings.pinned=pinned;
	savesettings();
	render();
}

function togglehide(id){
	const at=settings.hidden.indexOf(id);
	if(at===-1){
		settings.hidden.push(id);
	} else {
		settings.hidden.splice(at,1);
	}
	savesettings();
	render();
}

function toggleedit(){
	editing=!editing;
	clearTimeout(droptimer);
	carrying=null;
	maindiv.classList.remove("carrying");
	maindiv.classList.toggle("editing",editing);
	editbtn.innerText=editing?"Done":"Edit";
	render();
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
	const drawerapps=orderedapps().filter((eachapp) => editing || !ishidden(eachapp.id));
	placetiles(appbar,barapps.map((eachapp) => tilefor(eachapp,true)),1);   // the Apps button stays first
	placetiles(appluncher,drawerapps.map((eachapp) => tilefor(eachapp,false)),0);
}

let imagewallpapers=false;
let imagetimer=null;
let imageswap=null;
// last resort when neither the network videos nor access/wallpaper/loop.mp4 can play
function startimagewallpapers() {
	if(imagewallpapers){ return; }
	imagewallpapers=true;
	bgmode="images";
	bgvideo.style.display="none";
	bgvideo.removeAttribute("src");
	bgvideo.load();
	imageswap=() => {
		let wallpaperfile=wallpapers[Math.floor(Math.random() * wallpapers.length)];
		let preload=new Image();
		preload.src='access/wallpaper/'+wallpaperfile;
		//force the decode to happen now, off the swap, so the swap itself is a cheap composite instead of a stall.
		preload.decode().catch(()=>{}).then(() => {
			maindiv.style='background: no-repeat center / 100% url(access/wallpaper/'+wallpaperfile+') !important;';
		});
	};
	imageswap();
	imagetimer=setInterval(imageswap,20*1000);
}

// leave the image fallback so a video can play again (used when the video source is switched in settings)
function stopimagewallpapers() {
	if(!imagewallpapers){ return; }
	imagewallpapers=false;
	clearInterval(imagetimer);
	imagetimer=null;
	maindiv.style="";
	bgvideo.style.display="";
}

// Wallpaper source order: network videos (aerials.js) -> local access/wallpaper/loop.mp4 -> still images.
// The "Video source" setting can start at the local video instead of the network ones.
let bgmode="aerials";
let bgstarted=false;
let lastsource=null;
let bgqueue=[];
let bgcurrent=null;
let bgerrors=0;
let bglasttime=-1;
let applehttp=false;
const APPLE_HTTPS=/^https:\/\/sylvan\.apple\.com\//;
// access/wallpaper/loop.mp4 is one still per wallpaper, this many seconds each (SECS in scripts/make-wallpaper-video.sh)
const LOCAL_SEGMENT_SECONDS=20;

function loadaerial(entry) {
	bglasttime=-1;
	bgvideo.loop=false;
	bgvideo.src=applehttp?entry.u.replace(APPLE_HTTPS,"http://sylvan.apple.com/"):entry.u;
	bgvideo.play().catch(()=>{});
}

function nextaerial() {
	if(bgqueue.length===0){
		bgqueue=aerials.slice();
		for(let i=bgqueue.length-1;i>0;i--){
			const j=Math.floor(Math.random()*(i+1));
			[bgqueue[i],bgqueue[j]]=[bgqueue[j],bgqueue[i]];
		}
	}
	bgcurrent=bgqueue.pop();
	loadaerial(bgcurrent);
}

function startaerials() {
	stopimagewallpapers();
	bgmode="aerials";
	bgerrors=0;
	nextaerial();
}

function startlocalvideo() {
	stopimagewallpapers();
	bgmode="local";
	bgvideo.loop=true;
	bgvideo.src="access/wallpaper/loop.mp4";
	bgvideo.play().catch(()=>{});
}

// react to the "Video source" setting (called by applyprefs); only acts when that setting actually changed
function applybackgroundsource() {
	if(!bgstarted || prefs.videoSource===lastsource){ return; }
	lastsource=prefs.videoSource;
	if(prefs.videoSource==="offline"){
		startlocalvideo();
	} else if(typeof aerials!=="undefined" && aerials.length){
		startaerials();
	}
}

// what the info card shows
function nowplaying() {
	if(bgmode==="aerials" && bgcurrent){
		return {name:bgcurrent.n,source:bgcurrent.s+", streamed",video:true};
	}
	if(bgmode==="local"){
		return {name:"Built-in wallpaper loop",source:"Offline (built into the launcher)",video:true};
	}
	return {name:"Rotating pictures",source:"Offline (built into the launcher)",video:false};
}

function skipvideo() {
	if(bgmode==="aerials"){
		nextaerial();
	} else if(bgmode==="local" && isFinite(bgvideo.duration)){
		// the local loop is one wallpaper after another, so "the next video" is the next wallpaper
		const next=(Math.floor(bgvideo.currentTime/LOCAL_SEGMENT_SECONDS)+1)*LOCAL_SEGMENT_SECONDS;
		bgvideo.currentTime=next<bgvideo.duration?next:0;
	} else if(bgmode==="images" && imageswap){
		imageswap();
	}
}

function bgfailed() {
	if(bgmode==="aerials"){
		// Apple's certificate chain isn't trusted everywhere, and plain http works for them
		if(!applehttp && APPLE_HTTPS.test(bgcurrent.u)){
			applehttp=true;
			loadaerial(bgcurrent);
			return;
		}
		if(++bgerrors>=6){
			startlocalvideo();
		} else {
			nextaerial();
		}
	} else if(bgmode==="local"){
		startimagewallpapers();
	}
}

function startbackground() {
	bgvideo.onerror=bgfailed;
	bgvideo.onplaying=() => {bgerrors=0;};
	bgvideo.onended=() => {if(bgmode==="aerials"){ nextaerial(); }};
	bgvideo.onloadedmetadata=() => {
		if(bgmode==="local" && isFinite(bgvideo.duration)){ bgvideo.currentTime=Math.random()*bgvideo.duration; }
	};
	// don't stream or decode while another app is in front
	document.addEventListener("visibilitychange",() => {
		if(document.hidden){
			bgvideo.pause();
		} else if(bgmode!=="images"){
			bgvideo.play().catch(()=>{});
		}
	});
	// a stream that stalls or died while the TV slept never fires an error, so skip it if time stops moving
	setInterval(() => {
		if(bgmode!=="aerials" || document.hidden || bgvideo.paused){ return; }
		if(bgvideo.currentTime===bglasttime){
			nextaerial();
		} else {
			bglasttime=bgvideo.currentTime;
		}
	},30*1000);
	bgstarted=true;
	lastsource=prefs.videoSource;
	if(prefs.videoSource!=="offline" && typeof aerials!=="undefined" && aerials.length){
		nextaerial();
	} else {
		startlocalvideo();
	}
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
	console.log("reinit");
tilecache.bar.clear();
tilecache.drawer.clear();
render();
}

}
async function inithomescreen() {
await initpermcheck();
//back button
window.addEventListener("keydown", function(inEvent){
	if (inEvent.keyCode === 461) {
		if(settingsisopen()){
			closesettings();
		} else if(infoisopen()){
			closeinfo();
		} else {
			realappbarbtu.click();
		}
	}
});


loadsettings();
editbtn.addEventListener("click",toggleedit);
render();

}

document.addEventListener("DOMContentLoaded",inithomescreen);
document.addEventListener("DOMContentLoaded",startbackground);

document.addEventListener("webOSRelaunch", reload );

