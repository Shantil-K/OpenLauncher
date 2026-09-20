//SPDX-License-Identifier: WTFNMFPL
// The wallpaper: a video behind everything (#bgvideo), or a picture on #maindiv.
//
// What plays comes from the "Video source" setting (settings.js):
//   online   shuffled network videos from aerials.js
//   offline  the local access/wallpaper/loop.mp4
//   custom   the videos and photos the user added (prefs.customUrls)
// and each falls back when it fails: custom -> online -> local loop -> rotating pictures.

// ---- rotating pictures: the last resort, and also used when neither video can play
let imagewallpapers=false;
let imagetimer=null;
let imageswap=null;
function startimagewallpapers() {
	if(imagewallpapers){ return; }
	stopcustom();
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

// leave the pictures so a video can play again
function stopimagewallpapers() {
	if(!imagewallpapers){ return; }
	imagewallpapers=false;
	clearInterval(imagetimer);
	imagetimer=null;
	maindiv.style="";
	bgvideo.style.display="";
}

// ---- state shared by the sources
let bgmode="aerials";        // aerials | local | custom | images: what is really playing
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
const LOOP_EARLY_SECONDS=0.3;         // jump back this long before the end of a repeated built-in wallpaper (timeupdate is not exact)

function shuffled(list) {
	const copy=list.slice();
	for(let i=copy.length-1;i>0;i--){
		const j=Math.floor(Math.random()*(i+1));
		[copy[i],copy[j]]=[copy[j],copy[i]];
	}
	return copy;
}

// ---- looping the video that is playing (the Loop button of the info card)
let bgloop=false;         // repeat this video instead of moving on to the next one
let bgloopstart=0;        // built-in loop only: where the wallpaper being repeated starts

function loopable() {
	return bgmode==="aerials" || bgmode==="local" || (bgmode==="custom" && customcurrent!==null && customcurrent.kind==="video");
}

function islooping() {
	return bgloop && loopable();
}

// streamed and custom videos repeat natively (`loop`, so `ended` never fires); the built-in file is many wallpapers one after
// another, so there "this video" is the wallpaper playing now and we jump back to its start
function setloop(on) {
	if(on && !loopable()){ return; }
	bgloop=on;
	if(bgmode==="local"){
		bgloopstart=Math.floor(bgvideo.currentTime/LOCAL_SEGMENT_SECONDS)*LOCAL_SEGMENT_SECONDS;
	} else {
		bgvideo.loop=on;
	}
}

// a different video is starting: the loop was for the one before it
function resetloop() {
	bgloop=false;
	if(bgmode!=="local"){ bgvideo.loop=false; }
}

function loopbackcheck() {
	if(!(bgmode==="local" && bgloop && isFinite(bgvideo.duration))){ return; }
	const end=Math.min(bgloopstart+LOCAL_SEGMENT_SECONDS,bgvideo.duration);
	if(bgvideo.currentTime>=end-LOOP_EARLY_SECONDS || bgvideo.currentTime<bgloopstart-0.5){ bgvideo.currentTime=bgloopstart; }
}

// ---- online: aerials.js
function loadaerial(entry) {
	bglasttime=-1;
	bgloop=false;
	bgvideo.loop=false;
	bgvideo.src=applehttp?entry.u.replace(APPLE_HTTPS,"http://sylvan.apple.com/"):entry.u;
	bgvideo.play().catch(()=>{});
}

function nextaerial() {
	if(bgqueue.length===0){
		bgqueue=shuffled(aerials);
	}
	bgcurrent=bgqueue.pop();
	loadaerial(bgcurrent);
}

function startaerials() {
	stopimagewallpapers();
	stopcustom();
	bgmode="aerials";
	bgerrors=0;
	nextaerial();
}

// ---- offline: the built-in loop
function startlocalvideo() {
	stopimagewallpapers();
	stopcustom();
	bgmode="local";
	bgloop=false;
	bgvideo.loop=true;
	bgvideo.src="access/wallpaper/loop.mp4";
	bgvideo.play().catch(()=>{});
}

// ---- custom: links the user added (videos and photos)
const CUSTOM_VIDEO_EXT=/\.(mp4|m4v|mov|mkv|webm|ts)$/i;
const CUSTOM_IMAGE_EXT=/\.(jpe?g|png|webp|gif|bmp|avif)$/i;
const CUSTOM_MAX=30;
let customqueue=[];
let customcurrent=null;      // {u, n, kind}
let customtimer=null;

function customkind(url) {
	const path=url.split(/[?#]/)[0];
	return CUSTOM_VIDEO_EXT.test(path)?"video":CUSTOM_IMAGE_EXT.test(path)?"image":null;
}

// http(s) links, file:// links or absolute paths to a known video or photo type
function validcustomurl(url) {
	return typeof url==="string" && url.length<=500 && /^(https?:\/\/|file:\/\/|\/)/i.test(url) && !/["\\\s]/.test(url) && customkind(url)!==null;
}

function customname(url) {
	const path=url.split(/[?#]/)[0];
	const file=path.substring(path.lastIndexOf("/")+1) || path;
	try {
		return decodeURIComponent(file);
	} catch(e) {
		return file;
	}
}

function customhost(url) {
	const match=/^https?:\/\/([^\/:?#]+)/i.exec(url);
	return match?match[1]:"this TV";
}

function stopcustom() {
	clearTimeout(customtimer);
	customtimer=null;
	if(customcurrent){
		customcurrent=null;
		maindiv.style="";
		bgvideo.style.display="";
	}
}

function startcustom() {
	const list=prefs.customUrls.filter(validcustomurl);
	if(list.length===0){
		startsource("online");
		return;
	}
	stopimagewallpapers();
	clearTimeout(customtimer);
	bgmode="custom";
	bgerrors=0;
	customqueue=[];
	nextcustom();
}

function nextcustom() {
	clearTimeout(customtimer);
	if(customqueue.length===0){
		customqueue=shuffled(prefs.customUrls.filter(validcustomurl));
	}
	if(customqueue.length===0){
		startsource("online");
		return;
	}
	const url=customqueue.pop();
	customcurrent={u:url,n:customname(url),kind:customkind(url)};
	bgloop=false;
	if(customcurrent.kind==="video"){
		maindiv.style="";
		bgvideo.style.display="";
		bglasttime=-1;
		bgvideo.loop=false;
		bgvideo.src=url;
		bgvideo.play().catch(()=>{});
	} else {
		showcustomimage(url);
	}
}

function showcustomimage(url) {
	bgvideo.pause();
	bgvideo.removeAttribute("src");
	bgvideo.load();
	bgvideo.style.display="none";
	const picture=new Image();
	picture.src=url;
	picture.decode().then(() => {
		if(bgmode!=="custom" || !customcurrent || customcurrent.u!==url){ return; }
		bgerrors=0;
		maindiv.style='background: no-repeat center / cover url("'+url+'") !important;';
		customtimer=setTimeout(nextcustom,prefs.customSeconds*1000);
	},() => {
		if(bgmode==="custom" && customcurrent && customcurrent.u===url){ customfailed(); }
	});
}

function customfailed() {
	if(++bgerrors>=6){
		startsource("online");
	} else {
		nextcustom();
	}
}

// ---- which source, and switching
function wantedsource() {
	if(prefs.videoSource==="offline"){ return "offline"; }
	if(prefs.videoSource==="custom" && prefs.customUrls.some(validcustomurl)){ return "custom"; }
	return "online";
}

function startsource(kind) {
	if(kind==="offline"){
		startlocalvideo();
	} else if(kind==="custom"){
		startcustom();
	} else if(typeof aerials!=="undefined" && aerials.length){
		startaerials();
	} else {
		startlocalvideo();
	}
}

// react to the "Video source" setting (called by applyprefs); only acts when what should play actually changed
function applybackgroundsource() {
	if(!bgstarted){ return; }
	const kind=wantedsource();
	const signature=kind==="custom"?kind+JSON.stringify(prefs.customUrls):kind;
	if(signature===lastsource){ return; }
	lastsource=signature;
	startsource(kind);
}

// ---- what the info card shows, and Skip
function nowplaying() {
	if(bgmode==="custom" && customcurrent){
		return {name:customcurrent.n,source:"Custom, "+customhost(customcurrent.u),video:customcurrent.kind==="video"};
	}
	if(bgmode==="aerials" && bgcurrent){
		return {name:bgcurrent.n,source:bgcurrent.s+", streamed",video:true};
	}
	if(bgmode==="local"){
		return {name:"Built-in wallpaper loop",source:"Offline (built into the launcher)",video:true};
	}
	return {name:"Rotating pictures",source:"Offline (built into the launcher)",video:false};
}

function skipvideo() {
	resetloop();       // skipping means moving on
	if(bgmode==="aerials"){
		nextaerial();
	} else if(bgmode==="custom"){
		nextcustom();
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
	} else if(bgmode==="custom"){
		customfailed();
	} else if(bgmode==="local"){
		startimagewallpapers();
	}
}

function startbackground() {
	bgvideo.onerror=bgfailed;
	bgvideo.onplaying=() => {bgerrors=0;};
	bgvideo.ontimeupdate=loopbackcheck;
	bgvideo.onended=() => {
		if(bgmode==="aerials"){ nextaerial(); } else if(bgmode==="custom"){ nextcustom(); }
	};
	bgvideo.onloadedmetadata=() => {
		if(bgmode==="local" && isFinite(bgvideo.duration)){ bgvideo.currentTime=Math.random()*bgvideo.duration; }
	};
	// don't stream or decode while another app is in front
	document.addEventListener("visibilitychange",() => {
		if(document.hidden){
			bgvideo.pause();
		} else if(bgmode==="aerials" || bgmode==="local" || (bgmode==="custom" && customcurrent && customcurrent.kind==="video")){
			bgvideo.play().catch(()=>{});
		}
	});
	// a stream that stalls or died while the TV slept never fires an error, so skip it if time stops moving
	setInterval(() => {
		const streaming=bgmode==="aerials" || (bgmode==="custom" && customcurrent && customcurrent.kind==="video");
		if(!streaming || document.hidden || bgvideo.paused){ return; }
		if(bgvideo.currentTime===bglasttime){
			skipvideo();
		} else {
			bglasttime=bgvideo.currentTime;
		}
	},30*1000);
	bgstarted=true;
	const kind=wantedsource();
	lastsource=kind==="custom"?kind+JSON.stringify(prefs.customUrls):kind;
	startsource(kind);
}

document.addEventListener("DOMContentLoaded",startbackground);

// ---- settings row: the user's own wallpapers (a "custom" item in settings.js)
let wallpaperquery="";
let wallpaperstatus="";

function addcustomwallpaper() {
	const url=wallpaperquery.trim();
	if(url===""){ return; }
	if(!validcustomurl(url)){
		wallpaperstatus="Use a link (http://, https://, file://) or a path ending in .mp4 .mov .mkv .webm .jpg .png or .webp.";
	} else if(prefs.customUrls.indexOf(url)!==-1){
		wallpaperstatus="That one is already in the list.";
	} else if(prefs.customUrls.length>=CUSTOM_MAX){
		wallpaperstatus="The list is full ("+CUSTOM_MAX+"). Remove one first.";
	} else {
		wallpaperquery="";
		wallpaperstatus="Added.";
		setpref("customUrls",prefs.customUrls.concat([url]));   // saves, switches the wallpaper and redraws
		return;
	}
	renderpane();
}

function renderwallpaperlist(box) {
	const line=el("div","scontrol");
	const input=el("input","stext");
	input.setAttribute("type","text");
	input.setAttribute("placeholder","https://example.com/video.mp4");
	input.value=wallpaperquery;
	input.addEventListener("input",() => {wallpaperquery=input.value;});
	input.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ addcustomwallpaper(); }
	});
	line.appendChild(input);
	line.appendChild(optionbutton("Add",false,() => addcustomwallpaper(),"add"));
	box.appendChild(line);
	if(wallpaperstatus){ box.appendChild(el("div","sstatus",wallpaperstatus)); }
	if(prefs.customUrls.length===0){
		box.appendChild(el("div","sstatus","Nothing added yet, so the online videos play."));
	}
	prefs.customUrls.forEach((url) => {
		const row=el("div","listrow");
		row.appendChild(el("span","listkind",customkind(url)==="video"?"Video":"Photo"));
		const name=el("span","listname",customname(url));
		name.setAttribute("title",url);
		row.appendChild(name);
		const remove=el("button","sopt listremove");
		remove.innerHTML=iconsvg("close");
		remove.setAttribute("title","Remove");
		remove.setAttribute("aria-label","Remove "+customname(url));
		remove.addEventListener("click",() => {
			wallpaperstatus="";
			setpref("customUrls",prefs.customUrls.filter((other) => other!==url));
		});
		row.appendChild(remove);
		box.appendChild(row);
	});
}
