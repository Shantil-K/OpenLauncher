//SPDX-License-Identifier: WTFNMFPL

let inited=false;
let applist;
let appbardefu;
	  let noperm=true;
let appdir='/media/developer/apps/usr/palm/applications/moe.exkc.hoooooooooom';
function initapplun(){


          var iconhack = new window.PalmServiceBridge();
          var permtest = new window.PalmServiceBridge();
        permtest.onservicecallback = function(e) {
	                noperm=(!(JSON.parse(e).errorText === undefined));
console.log("perm:"+noperm);
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
function genappdiv (eachapp,whichappbox) {

		  const appitem = document.createElement("div");
		  const appname = document.createElement("p");
		  const appicon = document.createElement("img");
			if(noperm){
		appicon.src=appdir+'/hack/'+eachapp.folderPath+'/'+eachapp.icon;
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

let appluncherinit= function (payload) {
console.log("perm:"+noperm);

if (noperm){
	applist=JSON.parse(JSON.parse(payload).stdoutString).apps;
}else{
	applist=JSON.parse(payload).apps;
}
console.log("perm:"+noperm);
console.log(payload);
console.log(applist);
//barlist=["com.webos.app.camera","com.palm.app.settings"];
barlist=["com.webos.app.mediadiscovery","com.webos.app.hdmi1","com.webos.app.hdmi2","com.webos.app.hdmi3","com.webos.app.hdmi4","com.webos.app.livetv"];
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


document.addEventListener("DOMContentLoaded", (event) => {
initapplun();
		 setInterval(() => {

          var brclock = new window.PalmServiceBridge();
	brclock.onservicecallback= function (e) {
	let ltime=JSON.parse(e).localtime;
	
	clocktime.innerText=addzero(ltime.hour)+':'+addzero(ltime.minute)+':'+ addzero(ltime.second);
	clockdate.innerText=addzero(ltime.year)+'/'+addzero(ltime.month)+'/'+addzero(ltime.day) ;

};
	brclock.call('luna://com.palm.systemservice/time/getSystemTime','{}');

    }, 1000);

});

document.addEventListener("webOSRelaunch", (event) => {

		  var doireload = new window.PalmServiceBridge();
doireload.onservicecallback=function (payload) {

	let newapplist;
if (noperm){
	newapplist=JSON.parse(JSON.parse(payload).stdoutString).apps;
}else{
	newapplist=JSON.parse(payload).apps;
}


if (!( JSON.stringify(applist) === JSON.stringify(newapplist) ) ) {
initapplun();
	console.log("reinit");
}

};
	if (noperm){
	   doireload.call('luna://org.webosbrew.hbchannel.service/exec','{"command":"luna-send -n 1 -f luna://com.webos.applicationManager/listApps \'{}\'"}');

}else {
	doireload.call('luna://com.webos.applicationManager/listApps',"{}");

}

});

