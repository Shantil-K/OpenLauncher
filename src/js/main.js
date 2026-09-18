//SPDX-License-Identifier: WTFNMFPL

let inited=false;
let applist;
let appbardefu;
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
		appitem.setAttribute("class","appitem");
		appitem.setAttribute("data-appid",eachapp.id);
		appitem.appendChild(appicon);
		appitem.appendChild(appname);
		appitem.addEventListener("click", function(e){
			let clickelm;
			if (e.target.getAttribute("data-appid")==null){
				clickelm=e.target.parentElement.getAttribute("data-appid");
		} else {
				clickelm=e.target.getAttribute("data-appid");

			}
			if(rooted){
		lunacallasroot('luna://com.webos.service.applicationManager/launch',{"id":clickelm});
			} else {
		lunacall('luna://com.webos.service.applicationManager/launch',{"id":clickelm});
			}
console.log(clickelm);
		}); 
		whichappbox.appendChild(appitem);
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

if (noappperm && rooted && (!(inited))){
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

function appluncherinit() {
console.log(applist);
//barlist=["com.webos.app.camera","com.palm.app.settings"];
barlist=["com.webos.app.livetv","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.mediadiscovery","com.famobi.ctr","com.halfbrick.fruitninja","com.github.k4zmu2a.space-cadet-pinball",];
if (inited){

	appluncher.innerHTML="";
} else {

barlist.forEach(((eachid) => {

	applist.some((eachapp) => {if ( eachapp.id === eachid) {genappdiv(eachapp,appbar)}} );
}));


}
		applist.forEach(((echap) => genappdiv(echap,appluncher)));
	inited=true;

};

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
appluncherinit();
}

}
async function inithomescreen() {
await initpermcheck();
	 setInterval(() => {

	let now=new Date();

	clocktime.innerText=addzero(now.getHours())+':'+addzero(now.getMinutes())+':'+ addzero(now.getSeconds());
	clockdate.innerText=now.getFullYear()+'/'+addzero(now.getMonth()+1)+'/'+addzero(now.getDate()) ;

    }, 1000);

	 setInterval(() => {
let wallpaperfile=wallpapers[Math.floor(Math.random() * wallpapers.length)];
let preload=new Image();
preload.src='access/wallpaper/'+wallpaperfile;
//force the decode to happen now, off the swap, so the swap itself is a cheap composite instead of a stall.
preload.decode().catch(()=>{}).then(() => {
maindiv.style='background: no-repeat center / 100% url(access/wallpaper/'+wallpaperfile+') !important;';
});
    }, 20 * 1000);
//back button
window.addEventListener("keydown", function(inEvent){
	if (inEvent.keyCode === 461) {
		realappbarbtu.click();
	}
});


appluncherinit();

}

document.addEventListener("DOMContentLoaded",inithomescreen);

document.addEventListener("webOSRelaunch", reload );

