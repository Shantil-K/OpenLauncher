//SPDX-License-Identifier: WTFNMFPL

let inited=false;
let applist;
let appbardefu;
	  let noappperm=true;
	  let turstedapp=false,rooted=false;
let appid='moe.exkc.hoooooooooom'
let appdir='/media/developer/apps/usr/palm/applications/'+appid;

 
function genappdiv (eachapp,whichappbox) {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
			if(turstedapp){
		appicon.src=eachapp.folderPath+'/'+eachapp.icon;
			} else {
		if(rooted) {
		appicon.src='hack/'+eachapp.folderPath+'/'+eachapp.icon;
			}else{
appicon.src="/access/fallback.png";
			}
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
var brapp=new window.PalmServiceBridge();
			let clickelm;
			if (e.target.getAttribute("data-appid")==null){
				clickelm=e.target.parentElement.getAttribute("data-appid");
		} else {
				clickelm=e.target.getAttribute("data-appid");

			}
		brapp.call('luna://com.webos.service.applicationManager/launch','{"id":"'+clickelm+'"}');
			
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
	                noappperm=(typeof permtest === "string");

var rootcheck=await lunacall('luna://org.webosbrew.hbchannel.service/getConfiguration',{});
	if (typeof rootcheck === "string"){
		rooted=false;
	} else {
	       rooted=rootcheck.root;
	}

if (noappperm && rooted && (!(inited))){
iconhack(appdir);
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
barlist=["com.webos.app.livetv","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.mediadiscovery","com.github.k4zmu2a.space-cadet-pinball","com.famobi.ctr"];
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

          var brclock = new window.PalmServiceBridge();
	brclock.onservicecallback= function (e) {
	let ltime=JSON.parse(e).localtime;
	
	clocktime.innerText=addzero(ltime.hour)+':'+addzero(ltime.minute)+':'+ addzero(ltime.second);
	clockdate.innerText=addzero(ltime.year)+'/'+addzero(ltime.month)+'/'+addzero(ltime.day) ;

};
	brclock.call('luna://com.palm.systemservice/time/getSystemTime','{}');

    }, 1000);

	 setInterval(() => {
let wallpapernow='background: no-repeat center / 100% url(access/wallpaper/'+wallpapers[Math.floor(Math.random() * wallpapers.length)]+') !important;' 
//preload wallpaper so it would look smoother.
prefetchmaindiv.style=wallpapernow;

		 setTimeout(() => {
maindiv.style=wallpapernow;
		 },10 *1000);        }, 20 * 1000);
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

