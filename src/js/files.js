//SPDX-License-Identifier: WTFNMFPL
// A window for picking a picture, a video or a folder on a USB stick or in the TV's own storage (rooted TVs). Used by
// "Name and icon" (rename.js) to pick an icon and by Settings > Wallpaper > My own (background.js) to add wallpapers.
//
// Folders are listed through the root shell (Homebrew Channel's exec). The files themselves are loaded like the app
// icons: through the link to / that main.js makes inside the launcher's own folder (see localfileurl).

const FILES_PLACES_COMMAND="mkdir -p /media/developer/wallpapers 2>/dev/null; for d in /tmp/usb/*/*; do [ -d \"$d\" ] && echo \"$d\"; done; true";
const FILES_MAX=2000;            // entries shown in one folder
const FILES_THUMBS_MAX=60;       // small pictures of the photos in a folder, at most this many (4K photos are slow to shrink)
const FILES_WALLPAPER_DIR="/media/developer/wallpapers";
const FILES_STORAGE_DIR="/media/developer";

let filesstate=null;     // {title, kinds, folders, onpick, onfolder, place, path, entries, places, message, busy}

// a file on the TV, as a URL the launcher can load: an untrusted app only reaches its own folder, so it goes through the link
function localfileurl(path){
	const encoded=String(path).split("/").map(encodeURIComponent).join("/");
	if(rooted && !turstedapp){ return "hack"+(encoded.charAt(0)==="/"?"":"/")+encoded; }
	return "file://"+encoded;
}

function filekind(name){
	if(CUSTOM_IMAGE_EXT.test(name)){ return "image"; }
	if(CUSTOM_VIDEO_EXT.test(name)){ return "video"; }
	return null;
}

async function rootoutput(command){
	const result=await execasroot(command);
	if(!result || result.returnValue===false || result.errorText){ throw new Error((result && result.errorText) || "no answer"); }
	return String(result.stdoutString || "");
}

function filesopen(){
	return maindiv.classList.contains("filesopen");
}

// options: title, kinds (["image"] or ["image","video"]), folders (true: offer "Use this folder"), onpick(path), onfolder(path)
function openfilebrowser(options){
	if(!rooted){
		showmovetoast("Browsing USB and storage needs a rooted TV.");
		return;
	}
	filesstate=Object.assign({kinds:["image"],folders:false},options,{place:null,path:null,entries:[],places:[],message:"",busy:true});
	if(typeof keyboardmode!=="undefined" && keyboardmode && typeof dpadfocus!=="undefined" && dpadfocus && !filesbox.contains(dpadfocus)){ filesreturn=dpadfocus; }
	maindiv.classList.add("filesopen");
	renderfiles();
	loadplaces();
}

let filesreturn=null;     // what had the remote's focus before the window opened

function closefilebrowser(){
	filesstate=null;
	maindiv.classList.remove("filesopen");
	if(typeof keyboardmode!=="undefined" && keyboardmode && filesreturn && typeof setfocus==="function"){ setfocus(filesreturn); }
	filesreturn=null;
}

async function loadplaces(){
	const state=filesstate;
	let usb=[];
	try {
		usb=(await rootoutput(FILES_PLACES_COMMAND)).split("\n").map((line) => line.trim()).filter((line) => line.charAt(0)==="/");
	} catch(e) {}
	if(filesstate!==state){ return; }
	state.places=usb.map((path,i) => ({path:path,name:usb.length>1?"USB "+(i+1):"USB stick"})).concat([
		{path:FILES_WALLPAPER_DIR,name:"Wallpapers folder"},
		{path:FILES_STORAGE_DIR,name:"TV storage"}
	]);
	state.busy=false;
	// start on the USB stick if there is one, else on the wallpapers folder
	openplace(state.places[0]);
}

function openplace(place){
	if(!filesstate){ return; }
	filesstate.place=place;
	listfolder(place.path);
}

async function listfolder(path){
	const state=filesstate;
	state.path=path;
	state.busy=true;
	state.message="";
	state.entries=[];
	renderfiles();
	const command="cd "+shellquote(path)+" && for f in *; do [ -e \"$f\" ] || continue; if [ -d \"$f\" ]; then echo \"d/$f\"; else echo \"f/$f\"; fi; done | head -n "+FILES_MAX;
	let lines=[];
	try {
		lines=(await rootoutput(command)).split("\n");
	} catch(e) {
		if(filesstate!==state){ return; }
		state.busy=false;
		state.message="Couldn't open "+path+".";
		renderfiles();
		return;
	}
	if(filesstate!==state || state.path!==path){ return; }
	const folders=[];
	const files=[];
	lines.forEach((line) => {
		const name=line.slice(2);
		if(name===""){ return; }
		if(line.indexOf("d/")===0){ folders.push({name:name,dir:true}); }
		else if(line.indexOf("f/")===0){
			const kind=filekind(name);
			if(kind && state.kinds.indexOf(kind)!==-1){ files.push({name:name,kind:kind}); }
		}
	});
	state.entries=folders.concat(files);
	state.busy=false;
	if(state.entries.length===0){ state.message=state.kinds.indexOf("video")!==-1?"No pictures, videos or folders here.":"No pictures or folders here."; }
	renderfiles();
	// with the remote, a new folder starts on its first entry (not on "Up one folder", and not on the close button the
	// empty window had)
	if(typeof keyboardmode!=="undefined" && keyboardmode){
		const cards=within(fileslist,"button");
		const first=cards.filter((card) => !card.classList.contains("fileup"))[0] || cards[0];
		if(first){ setfocus(first); }
	}
}

function joinpath(dir,name){
	return dir.replace(/\/+$/,"")+"/"+name;
}

// the folder above, but never above the place it started from
function parentpath(){
	if(!filesstate || !filesstate.place || filesstate.path===filesstate.place.path){ return null; }
	return filesstate.path.replace(/\/[^\/]+\/?$/,"") || "/";
}

// Back: one folder up, or close at the top
function filesback(){
	const up=parentpath();
	if(up!==null){ listfolder(up); } else { closefilebrowser(); }
}

function filecard(label,picture,onclick,cls){
	const btn=el("button","sopt filecard"+(cls?" "+cls:""));
	btn.appendChild(picture);
	btn.appendChild(el("span","filename",label));
	btn.setAttribute("title",label);
	btn.addEventListener("click",onclick);
	return btn;
}

function fileicon(icon){
	const box=el("span","filepicture");
	box.innerHTML=iconsvg(icon);
	return box;
}

function filethumb(path){
	const box=el("span","filepicture");
	const img=document.createElement("img");
	img.alt="";
	img.setAttribute("loading","lazy");
	img.setAttribute("decoding","async");
	img.src=localfileurl(path);
	box.appendChild(img);
	return box;
}

function renderfiles(){
	if(!filesstate){ return; }
	const state=filesstate;
	filestitle.textContent=state.title || "Choose a file";
	filespath.textContent=state.path || "";
	filesplaces.innerHTML="";
	state.places.forEach((place) => {
		const btn=optionbutton(place.name,state.place===place,() => openplace(place),place.path.indexOf("/tmp/usb/")===0?"usb":"drive");
		btn.classList.add("compact");
		filesplaces.appendChild(btn);
	});
	filesactions.innerHTML="";
	if(state.folders && state.path && !state.busy){
		filesactions.appendChild(optionbutton("Use this whole folder",false,() => {
			const path=state.path;
			closefilebrowser();
			state.onfolder(path);
		},"photo"));
	}
	fileslist.innerHTML="";
	const up=parentpath();
	if(up!==null){ fileslist.appendChild(filecard("Up one folder",fileicon("back"),() => listfolder(up),"fileup")); }
	// small pictures need lazy loading, so a big folder doesn't shrink hundreds of photos at once (Chromium 76+)
	const thumbs=("loading" in HTMLImageElement.prototype);
	let shown=0;
	state.entries.forEach((entry) => {
		const path=joinpath(state.path,entry.name);
		if(entry.dir){
			fileslist.appendChild(filecard(entry.name,fileicon("folder"),() => listfolder(path)));
			return;
		}
		const picture=entry.kind==="image" && thumbs && shown++<FILES_THUMBS_MAX?filethumb(path):fileicon(entry.kind==="video"?"movie":"photo");
		fileslist.appendChild(filecard(entry.name,picture,() => {
			const pick=state.onpick;
			closefilebrowser();
			pick(path);
		}));
	});
	filesmessage.textContent=state.busy?"Looking...":state.message;
	if(typeof settle==="function"){ settle(); }
}

function initfiles(){
	filesclose.innerHTML=iconsvg("close");
	filesclose.addEventListener("click",closefilebrowser);
	filesbackdrop.addEventListener("click",closefilebrowser);
}

document.addEventListener("DOMContentLoaded",initfiles);
