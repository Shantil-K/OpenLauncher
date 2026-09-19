//SPDX-License-Identifier: WTFNMFPL

let applist;
let editing=false;
const SETTINGS_KEY='openlauncher.settings';
// used until the user pins/unpins something for the first time
const DEFAULT_PINNED=["com.webos.app.livetv","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.mediadiscovery","com.famobi.ctr","com.halfbrick.fruitninja","com.github.k4zmu2a.space-cadet-pinball"];
let settings={pinned:null,hidden:[]};
	  let noappperm=true;
	  let turstedapp=false,rooted=false;
let appid='com.homebrew.openlauncher'
let appdir='/media/developer/apps/usr/palm/applications/'+appid;

 
function genappdiv (eachapp,whichappbox) {

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
		appitem.setAttribute("class",ishidden(eachapp.id)?"appitem hiddenapp":"appitem");
		appitem.setAttribute("data-appid",eachapp.id);
		appitem.appendChild(appicon);
		appitem.appendChild(appname);
		const appctl=document.createElement("div");
		appctl.setAttribute("class","appctl");
		const pinbtn=document.createElement("button");
		pinbtn.innerText=ispinned(eachapp.id)?"Unpin":"Pin";
		pinbtn.addEventListener("click", function(e){
			e.stopPropagation();
			togglepin(eachapp.id);
		});
		appctl.appendChild(pinbtn);
		if(whichappbox!==appbar){
			const hidebtn=document.createElement("button");
			hidebtn.innerText=ishidden(eachapp.id)?"Show":"Hide";
			hidebtn.addEventListener("click", function(e){
				e.stopPropagation();
				togglehide(eachapp.id);
			});
			appctl.appendChild(hidebtn);
		}
		appitem.appendChild(appctl);

		appitem.addEventListener("click", function(){
			if(editing){ return; }
			if(rooted){
				lunacallasroot('luna://com.webos.service.applicationManager/launch',{"id":eachapp.id});
			} else {
				lunacall('luna://com.webos.service.applicationManager/launch',{"id":eachapp.id});
			}
		});
		whichappbox.appendChild(appitem);
	}

function loadsettings(){
	try {
		const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));
		if(saved){
			settings.pinned=Array.isArray(saved.pinned)?saved.pinned:null;
			settings.hidden=Array.isArray(saved.hidden)?saved.hidden:[];
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
	maindiv.classList.toggle("editing",editing);
	editbtn.innerText=editing?"Done":"Edit";
	render();
}

function addzero (l){


if (l <= 9){
			return ('0'+l);

		} else {

			return (l);
		}

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
	appbar.querySelectorAll(".appitem[data-appid]").forEach((el) => el.remove());
	appluncher.innerHTML="";
	const byid={};
	applist.forEach((eachapp) => {byid[eachapp.id]=eachapp;});
	pinnedids().forEach((eachid) => {
		if(byid[eachid] && !ishidden(eachid)){ genappdiv(byid[eachid],appbar); }
	});
	applist.forEach((eachapp) => {
		if(editing || !ishidden(eachapp.id)){ genappdiv(eachapp,appluncher); }
	});
}

let imagewallpapers=false;
// fallback used when access/wallpaper/loop.mp4 is missing or can't be played
function startimagewallpapers() {
	if(imagewallpapers){ return; }
	imagewallpapers=true;
	bgvideo.style.display="none";
	const swap=() => {
		let wallpaperfile=wallpapers[Math.floor(Math.random() * wallpapers.length)];
		let preload=new Image();
		preload.src='access/wallpaper/'+wallpaperfile;
		//force the decode to happen now, off the swap, so the swap itself is a cheap composite instead of a stall.
		preload.decode().catch(()=>{}).then(() => {
			maindiv.style='background: no-repeat center / 100% url(access/wallpaper/'+wallpaperfile+') !important;';
		});
	};
	swap();
	setInterval(swap,20*1000);
}

function randomstart(video) {
	if(isFinite(video.duration)){ video.currentTime=Math.random()*video.duration; }
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
render();
}

}
async function inithomescreen() {
await initpermcheck();
	 setInterval(() => {

	let now=new Date();

	clocktime.innerText=addzero(now.getHours())+':'+addzero(now.getMinutes())+':'+ addzero(now.getSeconds());
	clockdate.innerText=now.getFullYear()+'/'+addzero(now.getMonth()+1)+'/'+addzero(now.getDate()) ;

    }, 1000);

//back button
window.addEventListener("keydown", function(inEvent){
	if (inEvent.keyCode === 461) {
		realappbarbtu.click();
	}
});


loadsettings();
editbtn.addEventListener("click",toggleedit);
render();

}

document.addEventListener("DOMContentLoaded",inithomescreen);

document.addEventListener("webOSRelaunch", reload );

