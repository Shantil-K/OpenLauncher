//SPDX-License-Identifier: WTFNMFPL
// Screen protection for OLED TVs: a slow pixel shift, and after a while with no input: dimming (or hiding the bar, or
// everything but the clock), dimming or pausing the wallpaper, and turning the screen off (rooted TVs). All are off by
// default; see the Screen tab in settings.js.

// the shift walks around these offsets, one step a minute (multiplied by the amplitude below)
const SHIFT_PATTERN=[[0,0],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
// pixel shift setting (0 off, 1 small, 2 large) -> size of one step, in % of the screen height
const SHIFT_AMPLITUDE=[0,0.35,0.8];

let lastactivity=Date.now();
let shiftstep=0;
let shiftminutes=0;
let screenoff=false;      // OpenLauncher turned the screen off; it comes back on by itself with any button

function isidle(){
	if(!(prefs.idleAfter>0)){ return false; }
	// somebody is using the drawer, settings or the info card: not idle
	if(realappbarbtu.checked || settingsisopen() || infoisopen()){ return false; }
	return Date.now()-lastactivity>=prefs.idleAfter*60*1000;
}

function updateidle(){
	const idle=isidle();
	const was=maindiv.classList.contains("idle");
	maindiv.classList.toggle("idle",idle);
	maindiv.classList.toggle("idle-hidebar",idle && prefs.idleAction==="hidebar");
	maindiv.classList.toggle("idle-clockonly",idle && prefs.idleAction==="clockonly");
	document.body.classList.toggle("idle-dimwall",idle && prefs.idleWallpaper==="dim");
	// Pause: a video wallpaper stops on its picture while idle, and plays on from there when somebody comes back
	if(idle!==was && prefs.idleWallpaper==="pause" && typeof bgvideo!=="undefined" && bgvideo.style.display!=="none" && !document.hidden){
		if(idle){ bgvideo.pause(); } else { bgvideo.play().catch(()=>{}); }
	}
	checkscreenoff();
}

// Screen off after: the TV's own "screen off" (picture off, sound and apps on), through the TV's power service. Only while the
// home screen is showing; the TV turns the screen back on with any button.
function checkscreenoff(){
	if(!rooted || !(prefs.screenOffAfter>0) || screenoff || document.hidden){ return; }
	if(realappbarbtu.checked || settingsisopen() || infoisopen()){ return; }
	if(Date.now()-lastactivity<prefs.screenOffAfter*60*1000){ return; }
	screenoff=true;
	lunacallasroot('luna://com.webos.service.tvpower/power/turnOffScreen',{}).catch(() => {});
}

// any input counts; wake the screen at once instead of waiting for the next check
function wake(){
	lastactivity=Date.now();
	screenoff=false;
	if(maindiv.classList.contains("idle")){ updateidle(); }
}

function updateshift(){
	const root=document.documentElement.style;
	const amplitude=SHIFT_AMPLITUDE[prefs.pixelShift] || 0;
	const step=amplitude>0?SHIFT_PATTERN[shiftstep % SHIFT_PATTERN.length]:[0,0];
	const px=amplitude>0?Math.max(1,Math.round(amplitude*(window.innerHeight || 1080)/100)):0;
	maindiv.classList.toggle("shifting",amplitude>0);
	root.setProperty("--shiftx",step[0]*px+"px");
	root.setProperty("--shifty",step[1]*px+"px");
}

// one step every "Shift every" minutes
function stepshift(){
	shiftminutes++;
	if(shiftminutes<(prefs.shiftEvery || 1)){ return; }
	shiftminutes=0;
	shiftstep++;
	updateshift();
}

// called by applyprefs()
function applyscreen(){
	lastactivity=Date.now();
	updateidle();
	updateshift();
}

function initscreen(){
	["mousemove","mousedown","keydown","wheel","touchstart"].forEach((name) => window.addEventListener(name,wake,true));
	setInterval(updateidle,5*1000);
	setInterval(stepshift,60*1000);
}

document.addEventListener("DOMContentLoaded",initscreen);
