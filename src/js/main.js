//SPDX-License-Identifier: WTFNMFPL

let inited=false;
let applist;
let appbardefu;
	  let noperm=true;
let appdir='/media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom';

 function lunacallasroot (url,payload) {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
		luna.call('luna://org.webosbrew.hbchannel.service/exec',JSON.stringify({"command": ("luna-send -n 1 '"+url+"' '"+JSON.stringify(payload)+"'") }));
		luna.onservicecallback=function (payload) {
			  try {
                let outer = JSON.parse(payload);
                if (!outer.stdoutString) {
                    resolve(outer.errorText || "not stdout");
                    return;
                }

                resolve(JSON.parse(outer.stdoutString));
            } catch(e) {
                reject(e);
            }
		}
		});
	}

 function lunacall (url,payload) {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
		luna.call(url,JSON.stringify(payload));
		luna.onservicecallback=function (payload) {
			  try {
                let outer = JSON.parse(payload);
                if (!(outer.errorText===undefined)) {
                    resolve(outer.errorText || "not stdout");
                    return;
                }

                resolve(outer);
            } catch(e) {
                reject(e);
            }
		}
		});
	}
 function iconhack () {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
luna.call('luna://org.webosbrew.hbchannel.service/exec','{"command":"ln -s / '+appdir+'/hack"}');
		luna.onservicecallback=function (payload) {resolve(true);}
		});
	}

function genappdiv (eachapp,whichappbox) {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
			if(noperm){
		appicon.src='hack/'+eachapp.folderPath+'/'+eachapp.icon;
			} else {
		appicon.src=eachapp.folderPath+'/'+eachapp.icon;
			}
		appicon.setAttribute("class","appicon");
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

async function initapplun(){

var permtest=await lunacall('luna://com.webos.applicationManager/listApps',{});
	                noperm=(typeof permtest === "string");
if (noperm && (!(inited))){
iconhack();
}

			if (noperm){
var applistraw=await lunacallasroot('luna://com.webos.applicationManager/listApps',{});
applist=applistraw.apps;
}else {
applist=permtest.apps;
}

appluncherinit();

}

function appluncherinit() {

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
	if (noperm){
newapplistraw=await lunacallasroot('luna://com.webos.applicationManager/listApps',{});

}else {
newapplistraw=await lunacall('luna://com.webos.applicationManager/listApps',{});

}
console.log(newapplistraw);
	newapplist=newapplistraw.apps;

if (!( JSON.stringify(applist) === JSON.stringify(newapplist) ) ) {
	applist=newapplist;
	console.log("reinit");
initapplun();
}

}

document.addEventListener("DOMContentLoaded", (event) => {
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

var wallpapers=["IMG_20211017_181128.jpg", "IMG_5624.JPG", "IMG_5681.JPG", "IMG_5696.JPG", "IMG_5797.JPG", "IMG_5839.JPG", "IMG_5892.JPG", "IMG_5901.JPG" ];
maindiv.style='background: no-repeat center / 100% url(access/wallpaper/'+wallpapers[Math.floor(Math.random() * wallpapers.length)]+') !important;' 
    }, 30 * 1000);


initapplun();

});

document.addEventListener("webOSRelaunch", reload );

