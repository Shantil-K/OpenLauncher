//SPDX-License-Identifier: WTFNMFPL

let inited=false;
	  let noperm=true;
let appdir='/media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom';
function initapplun(){


          var iconhack = new window.PalmServiceBridge();
          var permtest = new window.PalmServiceBridge();
        permtest.onservicecallback = function(e) {
	                noperm=(!(JSON.parse(e).errorText === undefined));
console.log("perm:"+noperm);
		if (inited) {
		 setInterval(() => {

          var brclock = new window.PalmServiceBridge();
	brclock.onservicecallback= function (e) {
	let ltime=JSON.parse(e).localtime;
	
	clock.innerText=addzero(ltime.year)+'/'+addzero(ltime.month)+'/'+addzero(ltime.day)+' '+addzero(ltime.hour)+':'+addzero(ltime.minute)+':'+ addzero(ltime.second);

};
	brclock.call('luna://com.palm.systemservice/time/getSystemTime','{}');

    }, 1000);
}
		if (noperm){
			console.log(appdir);
			if(inited){
	   bridge.call('luna://org.webosbrew.hbchannel.service/exec','{"command":"luna-send -n 1 -f luna://com.webos.applicationManager/listApps \'{}\'"}');

			} else {

iconhack.call('luna://org.webosbrew.hbchannel.service/exec','{"command":"ln -s / '+appdir+'/hack"}');
				
}

}else {
	bridge.call('luna://com.webos.applicationManager/listApps',"{}");

}

};
		  var bridge = new window.PalmServiceBridge();
	bridge.onservicecallback =appluncherinit;
iconhack.onservicecallback= function (e) {
	   bridge.call('luna://org.webosbrew.hbchannel.service/exec','{"command":"luna-send -n 1 -f luna://com.webos.applicationManager/listApps \'{}\'"}');

};
permtest.call('luna://com.webos.applicationManager/listApps',"{}");



}
function addzero (l){


if (l <= 9){
			return ('0'+l);

		} else {

			return (l);
		}

}

let appluncherinit= function (payload) {
let applist;
console.log("perm:"+noperm);

if (noperm){
	applist=JSON.parse(JSON.parse(payload).stdoutString).apps;
}else{
	applist=JSON.parse(payload).apps;
}
console.log("perm:"+noperm);
console.log(payload);
console.log(applist);
if (inited){appluncher.innerHTML="";}
		applist.forEach((element) => {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
			if(noperm){
		appicon.src=appdir+'/hack/'+element.folderPath+'/'+element.icon;
			} else {
		appicon.src=element.folderPath+'/'+element.icon;
			}
		appicon.setAttribute("class","appicon");
		appicon.addEventListener("error", function(e){
			e.target.src=appdir+"/access/fallback.png";
		});
		appname.innerText=element.title;
		appname.setAttribute("class","appname");
		appitem.setAttribute("class","appitem");
		appitem.setAttribute("data-appid",element.id);
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
		appluncher.appendChild(appitem);
	});
	inited=true;

};


document.addEventListener("DOMContentLoaded", (event) => {
initapplun();
});

document.addEventListener("webOSRelaunch", (event) => {
initapplun();
});

