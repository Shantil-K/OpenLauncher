//SPDX-License-Identifier: WTFNMFPL
// The TV marks its built-in apps that are not meant for an app list (inputs, services, overlays...) with visible:false and the
// app menu leaves them out (see isuserapp() in main.js). A few of them are things people do use, so they are put in folders that
// are made for them on first run: Inputs (HDMI, DisplayPort, AV, Component, USB-C), TV, Settings, Sharing and Help. From then on
// they are ordinary folders: rename them, move apps out, or delete a folder (it stays deleted; Settings can restore them).
// An app that is in a folder is always listed, whether or not the TV marks it visible.

const SYSTEM_FOLDERS=[
	{id:"sys-inputs",name:"Inputs",
		pattern:/^com\.webos\.app\.(hdmi[0-9]+|dp[0-9]+|usbc[0-9]+|externalinput\..+)$/,
		ids:[]},
	{id:"sys-tv",name:"TV",ids:[
		"com.webos.app.livetv","com.webos.app.livemenu","com.webos.app.recordings","com.webos.app.scheduler",
		"com.webos.app.channeledit","com.webos.app.channelsetting"]},
	{id:"sys-settings",name:"Settings",ids:[
		"com.palm.app.settings","com.webos.app.softwareupdate","com.webos.app.picturewizard","com.webos.app.soundwizard",
		"com.webos.app.onetouchsoundtuning","com.webos.app.soundbar-setting","com.webos.app.gameoptimizer",
		"com.webos.app.familycare","com.webos.app.notificationcenter","com.webos.app.weatherlocation",
		"com.webos.app.connectionwizard","com.webos.app.screensaver","com.webos.app.membership"]},
	{id:"sys-sharing",name:"Sharing",ids:[
		"com.webos.app.miracast","airplay","com.webos.chromecast","com.webos.app.hdmioptical","com.webos.app.btspeakerapp",
		"com.webos.app.leaudio","com.webos.app.rdp","com.webos.app.homeoffice","com.webos.app.appcasting"]},
	{id:"sys-help",name:"Help",ids:[
		"com.webos.app.tvuserguide","com.webos.app.helpandtips","com.webos.app.remotecontrolguide",
		"com.webos.app.customersupport","com.webos.app.self-diagnosis"]}
];

function issystemfolder(id) {
	return SYSTEM_FOLDERS.some((group) => group.id===id);
}

// which of the groups above an app belongs to (or null)
function systemgroupof(app) {
	return SYSTEM_FOLDERS.filter((group) => group.ids.indexOf(app.id)!==-1 || (group.pattern && group.pattern.test(app.id)))[0] || null;
}

// the folder an app group lives in: its own, or one you made with the same name
function groupfolder(group) {
	return folderbyid(group.id) || settings.folders.filter((each) => each.name.toLowerCase()===group.name.toLowerCase())[0] || null;
}

// is there an app of these groups that is not in its folder (a folder deleted, an app taken out)? Then Settings offers "Restore".
function systemfoldersincomplete() {
	if(!applist){ return false; }
	return SYSTEM_FOLDERS.some((group) => {
		const folder=groupfolder(group);
		return applist.some((app) => app.visible===false && systemgroupof(app)===group && (!folder || settings.appfolder[app.id]!==folder.id));
	});
}

// Put the TV's hidden-by-default apps into their folders. Each app is placed once (`settings.sysplaced`), so an app you take
// out of a folder stays out; a folder you delete is not made again (`settings.sysdismissed`). `force` starts over: it forgets
// both lists and puts every one of these apps back in its folder.
function syncsystemfolders(force) {
	if(!applist){ return false; }
	if(force){
		settings.sysdismissed=[];
		settings.sysplaced=[];
	}
	let changed=!!force;
	SYSTEM_FOLDERS.forEach((group) => {
		if(settings.sysdismissed.indexOf(group.id)!==-1){ return; }
		const members=applist.filter((app) => app.visible===false && systemgroupof(app)===group);
		if(members.length===0){ return; }
		let folder=groupfolder(group);
		if(!folder){
			if(settings.folders.length>=FOLDER_MAX){ return; }
			folder={id:group.id,name:group.name};
			settings.folders=settings.folders.concat([folder]);
			changed=true;
		}
		members.forEach((app) => {
			if(settings.sysplaced.indexOf(app.id)!==-1){ return; }
			settings.sysplaced.push(app.id);
			settings.appfolder[app.id]=folder.id;
			changed=true;
		});
	});
	if(changed){ savesettings(); }
	return changed;
}
