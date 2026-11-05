//SPDX-License-Identifier: WTFNMFPL
// Input status: HDMI tiles with nothing plugged in are dimmed, and the name a connected device gives itself over HDMI-CEC
// ("PlayStation 5") is shown on its input's tile instead of "HDMI 2" (unless you renamed it). Apps > Input status.
//
// What the TV reports, as found by Glasshouse's research (github.com/rorygallagher2024/glasshouse, MIT):
//  - com.webos.service.eim/getAllInputStatus lists each input; CEC devices are in its subList with id "SIMPLINK" and their
//    own osdName (a console behind a receiver is a second entry, depth 2)
//  - some TVs say connected:true for every port, so hdmiPlugIn decides where it is given; a TV that gives neither
//    (webOS 4) counts every port as plugged in
//  - there is no subscription for changes, so it is asked again whenever the launcher comes back to the front

let inputstatus={};      // app id (com.webos.app.hdmi2) -> {plugged, names: ["PlayStation 5"]}
let inputsbusy=false;

function inputinfo(id){
	return prefs.inputStatus && inputstatus[id]?inputstatus[id]:null;
}

// the device names on an input, for its tile (main.js appdisplayname)
function inputname(id){
	const info=inputinfo(id);
	return info && info.plugged && info.names.length>0?info.names.join(" / "):null;
}

function inputunplugged(id){
	const info=inputinfo(id);
	return !!info && !info.plugged;
}

function readinputs(devices){
	const next={};
	(Array.isArray(devices)?devices:[]).forEach((device) => {
		if(!device || typeof device.appId!=="string" || !/^com\.webos\.app\.hdmi\d$/.test(device.appId)){ return; }
		const plugged=typeof device.hdmiPlugIn==="boolean"?device.hdmiPlugIn:device.connected!==false;
		const names=[];
		// deepest first: behind a receiver, the console (depth 2) is what you want to see, the receiver (depth 1) after it
		const subs=(Array.isArray(device.subList)?device.subList:[]).slice().sort((a,b) => ((b && b.depth) || 0)-((a && a.depth) || 0));
		subs.forEach((sub) => {
			if(!sub || sub.id!=="SIMPLINK" || typeof sub.osdName!=="string"){ return; }
			const name=sub.osdName.replace(/\s+/g," ").trim().slice(0,40);
			if(name && names.indexOf(name)===-1){ names.push(name); }
		});
		next[device.appId]={plugged:plugged,names:names};
	});
	return next;
}

async function refreshinputs(){
	if(!prefs.inputStatus || inputsbusy || document.hidden){ return; }
	inputsbusy=true;
	let result=null;
	try {
		result=await lunacall('luna://com.webos.service.eim/getAllInputStatus',{});
		if((!result || result.returnValue===false || result.errorText!==undefined) && rooted){
			result=await lunacallasroot('luna://com.webos.service.eim/getAllInputStatus',{});
		}
	} catch(e) {}
	inputsbusy=false;
	if(!result || !Array.isArray(result.devices)){ return; }
	const next=readinputs(result.devices);
	if(JSON.stringify(next)!==JSON.stringify(inputstatus)){
		inputstatus=next;
		render();
	}
}

function initinputs(){
	document.addEventListener("visibilitychange",() => { if(!document.hidden){ refreshinputs(); readtvclock(); } });
	document.addEventListener("webOSRelaunch",refreshinputs);
}

document.addEventListener("DOMContentLoaded",initinputs);
