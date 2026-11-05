//SPDX-License-Identifier: WTFNMFPL
// The wallpaper: a video behind everything (#bgvideo), or a picture on its own layer (#bgpicture).
//
// What plays comes from the "Wallpaper" setting (settings.js):
//   online   shuffled network videos from aerials.js
//   custom   "My wallpapers": the built-in photos, pictures, videos and folders (USB or the TV) and links the user chose
//            (prefs.customUrls). One of them stays put; several take turns.
// and each falls back when it fails: custom -> online -> rotating built-in photos.

// ---- the picture layer. A picture is its own element and compositor layer behind #maindiv, not a CSS background on
// #maindiv: there, every tile hover repainted that part of the full-size photo on the TV's CPU.
function showpicture(src,ondone,onfail) {
	const picture=new Image();
	picture.src=src;
	picture.decode().then(() => {
		if(ondone && ondone()===false){ return; }      // the wallpaper changed while this was decoding
		bgvideo.style.display="none";
		bgpicture.src=src;
		bgpicture.style.display="block";
	},() => { if(onfail){ onfail(); } });
}

function hidepicture() {
	bgpicture.style.display="none";
	bgpicture.removeAttribute("src");
	bgvideo.style.display="";
}

function stopvideo() {
	bgvideo.pause();
	clearbgvideosource();
	bgvideo.load();
	bgvideo.style.display="none";
}

// ---- rotating built-in photos: the last resort, when neither the chosen wallpapers nor the online videos play
let imagewallpapers=false;
let imagetimer=null;
let imageswap=null;
let imagecurrent=null;
function startimagewallpapers() {
	if(imagewallpapers){ return; }
	stopcustom();
	imagewallpapers=true;
	bgmode="images";
	stopvideo();
	imageswap=() => {
		imagecurrent=wallpapers[Math.floor(Math.random() * wallpapers.length)];
		showpicture('access/wallpaper/'+imagecurrent,() => bgmode==="images");
	};
	imageswap();
	imagetimer=setInterval(imageswap,20*1000);
}

// leave the photos so a video can play again
function stopimagewallpapers() {
	if(!imagewallpapers){ return; }
	imagewallpapers=false;
	clearInterval(imagetimer);
	imagetimer=null;
	hidepicture();
}

// ---- state shared by the sources
let bgmode="aerials";        // aerials | custom | images: what is really playing
let bgstarted=false;
let lastsource=null;
let bgqueue=[];
let bgcurrent=null;
let bgerrors=0;
let bglasttime=-1;
let applehttp=false;
const APPLE_HTTPS=/^https:\/\/sylvan\.apple\.com\//;

function clearbgvideosource() {
	while(bgvideo.firstChild){ bgvideo.removeChild(bgvideo.firstChild); }
	bgvideo.removeAttribute("src");
}

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

function loopable() {
	return bgmode==="aerials" || (bgmode==="custom" && customcurrent!==null && customcurrent.kind==="video");
}

function islooping() {
	return bgloop && loopable();
}

// videos repeat natively (`loop`, so `ended` never fires)
function setloop(on) {
	if(on && !loopable()){ return; }
	bgloop=on;
	bgvideo.loop=on;
}

// a different video is starting: the loop was for the one before it
function resetloop() {
	bgloop=false;
	bgvideo.loop=false;
}

// ---- online: aerials.js
function loadaerial(entry) {
	bglasttime=-1;
	bgloop=false;
	bgvideo.loop=false;
	clearbgvideosource();
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
	if(typeof aerials==="undefined" || aerials.length===0){
		startimagewallpapers();
		return;
	}
	stopimagewallpapers();
	stopcustom();
	bgmode="aerials";
	bgerrors=0;
	nextaerial();
}

// ---- custom: "My wallpapers"
//   builtin:<file>   one of the launcher's own photos (access/wallpaper, listed in wallpaper.js)
//   /path/file.jpg   a picture or video on the TV or a USB stick (picked in the file browser, files.js)
//   /path/folder/    a whole folder: its pictures and videos, and those of the folders inside it, looked up at each start
//   https://...      a link to a picture or video (the online albums' photos are links too: onlinewallpapers.js)
//   album:<id>       a whole online album: its photos take turns
const CUSTOM_VIDEO_EXT=/\.(mp4|m4v|mov|mkv|webm|ts)$/i;
const CUSTOM_IMAGE_EXT=/\.(jpe?g|png|webp|gif|bmp|avif)$/i;
const CUSTOM_MAX=40;
const CUSTOM_FOLDER_FILES_MAX=5000;
const CUSTOM_FOLDER_DEPTH=4;
let customqueue=[];
let customitems=[];       // what plays: the entries, with each folder replaced by the files found in it
let customrun=0;          // counts starts, so a folder lookup that finishes after the list changed is thrown away
let customcurrent=null;   // {u, n, kind}
let customtimer=null;

function isbuiltin(url) {
	return typeof url==="string" && url.indexOf("builtin:")===0 && typeof wallpapers!=="undefined" && wallpapers.indexOf(url.slice(8))!==-1;
}

// ---- the online albums (onlinewallpapers.js): Wikimedia Commons featured pictures, each with its author and license
function onlinealbums() {
	return typeof ONLINE_ALBUMS!=="undefined" && Array.isArray(ONLINE_ALBUMS)?ONLINE_ALBUMS:[];
}

function albumbyid(id) {
	return onlinealbums().filter((album) => album.id===id)[0] || null;
}

function isalbum(url) {
	return typeof url==="string" && url.indexOf("album:")===0 && !!albumbyid(url.slice(6));
}

let onlinephotos=null;     // link -> {n, by, lic, album}
function onlinephoto(url) {
	if(!onlinephotos){
		onlinephotos={};
		onlinealbums().forEach((album) => album.photos.forEach((photo) => {
			onlinephotos[photo.u]=Object.assign({album:album.id},photo);
		}));
	}
	return onlinephotos[url] || null;
}

function iscustomfolder(url) {
	return typeof url==="string" && /^\/[^"\\]*\/$/.test(url) && url.length>1;
}

function customkind(url) {
	if(isbuiltin(url)){ return "image"; }
	const path=/^https?:/i.test(url)?url.split(/[?#]/)[0]:url;      // a file name on the TV may have # or ? in it
	return CUSTOM_VIDEO_EXT.test(path)?"video":CUSTOM_IMAGE_EXT.test(path)?"image":null;
}

// Paths on the TV may have spaces in them (folders on a USB stick often do); links may not.
function validcustomurl(url) {
	if(typeof url!=="string" || url.length>500 || /["\\\n\r]/.test(url)){ return false; }
	if(isbuiltin(url) || iscustomfolder(url) || isalbum(url)){ return true; }
	if(/^https?:\/\//i.test(url)){ return !/\s/.test(url) && customkind(url)!==null; }
	return /^(file:\/\/|\/)/i.test(url) && customkind(url)!==null;
}

// what the <video> or the picture loads: a path on the TV goes through files.js's localfileurl (an untrusted app can only
// reach files outside its own folder through the link main.js makes)
function customsrc(url) {
	if(isbuiltin(url)){ return "access/wallpaper/"+url.slice(8); }
	if(url.charAt(0)==="/"){ return localfileurl(url); }
	if(/^file:\/\//i.test(url)){
		let path=url.slice(7);
		try { path=decodeURI(path); } catch(e) {}
		return localfileurl(path);
	}
	return url;
}

function customname(url) {
	if(isbuiltin(url)){ return "Built-in photo "+(wallpapers.indexOf(url.slice(8))+1); }
	if(isalbum(url)){ return albumbyid(url.slice(6)).name+" album"; }
	const online=onlinephoto(url);
	if(online){ return online.n; }
	if(iscustomfolder(url)){
		const parts=url.split("/").filter((part) => part!=="");
		return parts[parts.length-1] || url;
	}
	const path=/^https?:/i.test(url)?url.split(/[?#]/)[0]:url;
	const file=path.substring(path.lastIndexOf("/")+1) || path;
	try {
		return decodeURIComponent(file);
	} catch(e) {
		return file;
	}
}

// where it comes from; for an online photo also who took it and its license, as its license asks
function customhost(url) {
	if(isbuiltin(url)){ return "built into the launcher"; }
	const online=onlinephoto(url);
	if(online){ return "by "+online.by+", "+online.lic+", Wikimedia Commons"; }
	const match=/^https?:\/\/([^\/:?#]+)/i.exec(url);
	if(match){ return match[1]; }
	return /^(file:\/\/)?\/tmp\/usb\//i.test(url)?"USB stick":"this TV";
}

function stopcustom() {
	clearTimeout(customtimer);
	customtimer=null;
	if(customcurrent){
		customcurrent=null;
		hidepicture();
	}
}

// the pictures and videos in a folder and the folders inside it (needs root to look)
async function customfolderfiles(folder) {
	if(!rooted){ return []; }
	const command="find "+shellquote(folder.replace(/\/+$/,""))+" -maxdepth "+CUSTOM_FOLDER_DEPTH+" -type f 2>/dev/null | sort | head -n "+CUSTOM_FOLDER_FILES_MAX;
	try {
		const result=await execasroot(command);
		return String((result && result.stdoutString) || "").split("\n").filter((path) => path.charAt(0)==="/" && path.indexOf("/.")===-1 && customkind(path)!==null);
	} catch(e) {
		return [];
	}
}

async function startcustom() {
	const list=prefs.customUrls.filter(validcustomurl);
	if(list.length===0){
		startaerials();
		return;
	}
	const run=++customrun;
	stopimagewallpapers();
	clearTimeout(customtimer);
	bgmode="custom";
	bgerrors=0;
	customqueue=[];
	let items=list.filter((url) => !iscustomfolder(url) && !isalbum(url));
	list.filter(isalbum).forEach((url) => {
		albumbyid(url.slice(6)).photos.forEach((photo) => { if(items.indexOf(photo.u)===-1){ items.push(photo.u); } });
	});
	const folders=list.filter(iscustomfolder);
	for(let i=0;i<folders.length;i++){
		items=items.concat(await customfolderfiles(folders[i]));
		if(run!==customrun || bgmode!=="custom"){ return; }     // the setting changed while we were looking
	}
	if(items.length===0){
		startaerials();
		return;
	}
	customitems=items;
	nextcustom();
}

function nextcustom() {
	clearTimeout(customtimer);
	if(customqueue.length===0){
		customqueue=shuffled(customitems);
	}
	const url=customqueue.pop();
	customcurrent={u:url,n:customname(url),kind:customkind(url)};
	bgloop=false;
	if(customcurrent.kind==="video"){
		hidepicture();
		bglasttime=-1;
		// a single video just repeats
		bgvideo.loop=customitems.length===1;
		clearbgvideosource();
		bgvideo.src=customsrc(url);
		bgvideo.play().catch(()=>{});
	} else {
		showcustomimage(url);
	}
}

function showcustomimage(url) {
	stopvideo();
	showpicture(customsrc(url),() => {
		if(bgmode!=="custom" || !customcurrent || customcurrent.u!==url){ return false; }
		bgerrors=0;
		// a single picture stays put; several take turns
		if(customitems.length>1){ customtimer=setTimeout(nextcustom,prefs.customSeconds*1000); }
		return true;
	},() => {
		if(bgmode==="custom" && customcurrent && customcurrent.u===url){ customfailed(); }
	});
}

function customfailed() {
	if(++bgerrors>=Math.min(6,Math.max(1,customitems.length))){
		startaerials();
	} else {
		nextcustom();
	}
}

// ---- which source, and switching
function wantedsource() {
	if(prefs.videoSource==="custom" && prefs.customUrls.some(validcustomurl)){ return "custom"; }
	return "online";
}

function startsource(kind) {
	if(kind==="custom"){ startcustom(); } else { startaerials(); }
}

function sourcesignature(kind) {
	return kind==="custom"?kind+JSON.stringify(prefs.customUrls):kind;
}

// react to the wallpaper setting (called by applyprefs); only acts when what should play actually changed
function applybackgroundsource() {
	if(!bgstarted){ return; }
	const kind=wantedsource();
	const signature=sourcesignature(kind);
	if(signature===lastsource){
		// the time between pictures changed: the next turn uses it
		return;
	}
	lastsource=signature;
	startsource(kind);
}

// ---- what the info card shows, and Skip
function nowplaying() {
	if(bgmode==="custom" && customcurrent){
		return {name:customcurrent.n,source:"My wallpapers, "+customhost(customcurrent.u),video:customcurrent.kind==="video"};
	}
	if(bgmode==="aerials" && bgcurrent){
		return {name:bgcurrent.n,source:bgcurrent.s+", streamed",video:true};
	}
	return {name:"Built-in photos",source:"The online videos didn't play",video:false};
}

function skipvideo() {
	resetloop();       // skipping means moving on
	if(bgmode==="aerials"){
		nextaerial();
	} else if(bgmode==="custom"){
		nextcustom();
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
			startimagewallpapers();
		} else {
			nextaerial();
		}
	} else if(bgmode==="custom"){
		customfailed();
	}
}

function startbackground() {
	bgvideo.onerror=bgfailed;
	bgvideo.onplaying=() => {bgerrors=0;};
	bgvideo.onended=() => {
		if(bgmode==="aerials"){ nextaerial(); } else if(bgmode==="custom"){ nextcustom(); }
	};
	// don't stream or decode while another app is in front
	document.addEventListener("visibilitychange",() => {
		if(document.hidden){
			bgvideo.pause();
		} else if(bgmode==="aerials" || (bgmode==="custom" && customcurrent && customcurrent.kind==="video")){
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
	lastsource=sourcesignature(kind);
	startsource(kind);
}

document.addEventListener("DOMContentLoaded",startbackground);

// ---- Settings > Wallpaper > My wallpapers (a "custom" item in settings.js): one list of everything chosen
let wallpaperquery="";
let wallpaperstatus="";

function addwallpaper(url) {
	if(prefs.customUrls.indexOf(url)!==-1){
		wallpaperstatus="That one is already chosen.";
	} else if(prefs.customUrls.length>=CUSTOM_MAX){
		wallpaperstatus="That's the most you can choose ("+CUSTOM_MAX+"). Remove one first.";
	} else {
		wallpaperstatus="";
		setpref("customUrls",prefs.customUrls.concat([url]));   // saves, switches the wallpaper and redraws
		return;
	}
	renderpane();
}

function removewallpaper(url) {
	wallpaperstatus="";
	setpref("customUrls",prefs.customUrls.filter((other) => other!==url));
}

function addwallpaperlink() {
	const url=wallpaperquery.trim();
	if(url===""){ return; }
	if(!/^https?:\/\//i.test(url) || !validcustomurl(url)){
		wallpaperstatus="Use a link starting with https:// and ending in .jpg .png .webp .mp4 .mov .mkv or .webm.";
		renderpane();
		return;
	}
	wallpaperquery="";
	addwallpaper(url);
}

function browsewallpapers() {
	openfilebrowser({
		title:"Add a wallpaper",
		kinds:["image","video"],
		folders:true,
		onpick:(path) => addwallpaper(path),
		onfolder:(path) => addwallpaper(path.replace(/\/+$/,"")+"/")
	});
}

// the full-size built-in photos are camera photos (up to 5.6 MB); the grid shows the small copies in access/wallpaper/thumbs
function thumbpath(file) {
	return "access/wallpaper/thumbs/"+file.replace(/\.[^.]+$/,"")+".jpg";
}

// what will happen, in words
function wallpapersummary() {
	const list=prefs.customUrls.filter(validcustomurl);
	if(list.length===0){ return "Nothing chosen yet, so the online videos play. Pick a photo below, or add your own."; }
	if(list.length===1 && !iscustomfolder(list[0]) && !isalbum(list[0])){
		return customkind(list[0])==="video"?"This video plays on repeat.":"This picture stays as your wallpaper.";
	}
	return "These take turns in random order.";
}

function renderwallpaperlist(box) {
	box.appendChild(el("div","sstatus wallsummary",wallpapersummary()));
	// the built-in photos: press one to add or remove it
	const list=(typeof wallpapers!=="undefined")?wallpapers:[];
	if(list.length>0){
		box.appendChild(el("div","wallgroup","Built-in photos"));
		const grid=el("div","picturepicker");
		list.forEach((file,index) => {
			const url="builtin:"+file;
			const chosen=prefs.customUrls.indexOf(url)!==-1;
			const btn=el("button","picturepick"+(chosen?" on":""));
			const img=document.createElement("img");
			img.src=thumbpath(file);
			img.alt="";
			btn.appendChild(img);
			if(chosen){
				const tick=el("span","picturetick");
				tick.innerHTML=iconsvg("check");
				btn.appendChild(tick);
			}
			const label=(chosen?"Remove ":"Add ")+"built-in photo "+(index+1);
			btn.setAttribute("title",label);
			btn.setAttribute("aria-label",label);
			btn.addEventListener("click",() => { if(chosen){ removewallpaper(url); } else { addwallpaper(url); } });
			grid.appendChild(btn);
		});
		box.appendChild(grid);
	}
	renderonlinealbums(box);
	// your own: from the TV or a USB stick, or a link
	box.appendChild(el("div","wallgroup","Your own"));
	const line=el("div","scontrol");
	if(rooted){ line.appendChild(optionbutton("Browse USB and TV storage",false,() => browsewallpapers(),"usb")); }
	const input=el("input","stext");
	input.setAttribute("type","text");
	input.setAttribute("placeholder","or paste a link: https://example.com/video.mp4");
	input.value=wallpaperquery;
	input.addEventListener("input",() => {wallpaperquery=input.value;});
	input.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ addwallpaperlink(); }
	});
	line.appendChild(input);
	line.appendChild(optionbutton("Add",false,() => addwallpaperlink(),"add"));
	box.appendChild(line);
	if(wallpaperstatus){ box.appendChild(el("div","sstatus",wallpaperstatus)); }
	prefs.customUrls.filter((url) => !isbuiltin(url) && !isalbum(url) && !onlinephoto(url)).forEach((url) => {
		const row=el("div","listrow");
		row.appendChild(el("span","listkind",iscustomfolder(url)?"Folder":customkind(url)==="video"?"Video":"Photo"));
		const name=el("span","listname",customname(url));
		name.setAttribute("title",url);
		row.appendChild(name);
		const remove=el("button","sopt listremove");
		remove.innerHTML=iconsvg("close");
		remove.setAttribute("title","Remove");
		remove.setAttribute("aria-label","Remove "+customname(url));
		remove.addEventListener("click",() => removewallpaper(url));
		row.appendChild(remove);
		box.appendChild(row);
	});
}

// several wallpapers (or a folder) take turns; one stays put
function wallpaperstaketurns(p) {
	const list=p.customUrls.filter(validcustomurl);
	return list.length>1 || list.some(iscustomfolder) || list.some(isalbum);
}

// ---- Settings: the online albums. Pick single photos (each becomes a link), or "Use the whole album" to have all of its
// photos take turns. The small previews come from Wikimedia Commons too.
let wallalbum=null;      // the album being looked at

function renderonlinealbums(box) {
	const albums=onlinealbums();
	if(albums.length===0){ return; }
	if(!albumbyid(wallalbum)){ wallalbum=albums[0].id; }
	const album=albumbyid(wallalbum);
	box.appendChild(el("div","wallgroup","Online photos"));
	const tabs=el("div","scontrol albumtabs");
	albums.forEach((each) => {
		const whole=prefs.customUrls.indexOf("album:"+each.id)!==-1;
		const picked=each.photos.filter((photo) => prefs.customUrls.indexOf(photo.u)!==-1).length;
		const tab=optionbutton(each.name+(whole?" (all)":picked?" ("+picked+")":""),each.id===wallalbum,() => {
			wallalbum=each.id;
			renderpane();
		});
		tab.classList.add("compact");
		tabs.appendChild(tab);
	});
	box.appendChild(tabs);
	const albumurl="album:"+album.id;
	const whole=prefs.customUrls.indexOf(albumurl)!==-1;
	const line=el("div","scontrol");
	const toggle=optionbutton(whole?"Whole album is on":"Use the whole album",whole,() => {
		if(whole){ removewallpaper(albumurl); } else { addwallpaper(albumurl); }
	},"photo");
	line.appendChild(toggle);
	line.appendChild(el("span","albumnote",whole?"All "+album.photos.length+" photos take turns. Press again to stop.":"Or press photos below to pick just those."));
	box.appendChild(line);
	const grid=el("div","picturepicker");
	album.photos.forEach((photo) => {
		const chosen=whole || prefs.customUrls.indexOf(photo.u)!==-1;
		const btn=el("button","picturepick"+(chosen?" on":"")+(whole?" inalbum":""));
		const img=document.createElement("img");
		img.src=photo.t;
		img.alt="";
		img.setAttribute("loading","lazy");
		btn.appendChild(img);
		if(chosen){
			const tick=el("span","picturetick");
			tick.innerHTML=iconsvg("check");
			btn.appendChild(tick);
		}
		const credit=photo.n+", by "+photo.by+" ("+photo.lic+")";
		btn.setAttribute("title",credit);
		btn.setAttribute("aria-label",credit);
		if(whole){
			btn.disabled=true;
		} else {
			btn.addEventListener("click",() => { if(chosen){ removewallpaper(photo.u); } else { addwallpaper(photo.u); } });
		}
		grid.appendChild(btn);
	});
	box.appendChild(grid);
	box.appendChild(el("div","sstatus albumcredit","Photos from Wikimedia Commons, each by its author under a free license (shown in the Now playing card)."));
}
