//SPDX-License-Identifier: WTFNMFPL
// The window Settings > Apps > Names and icons opens for an app: the app's icon
// and its original name, a text box with the name it has now, Save, and "Use the original name". Below that the icon: a
// picture from a USB stick or the TV's storage (rooted TVs, see files.js), or the app's own icon again.
// The names live in `settings.names` and the icons in `settings.icons` (main.js).
//
// A picked picture is cropped to a square and shrunk to ICON_SIZE, then kept inside the launcher's settings as a data: URL,
// so the USB stick can come out afterwards and the icon goes into backups too.

const ICON_SIZE=192;

let renameapp=null;        // id of the app being renamed
let renamefrom=-1;         // with the remote: which Settings button opened the window, to go back to it when it closes

function renameopen() {
	return maindiv.classList.contains("renameopen");
}

function closerename() {
	renameapp=null;
	maindiv.classList.remove("renameopen");
	renamemessage.textContent="";
	if(settingsisopen()){
		renderpane();        // the list shows the new name and icon
		const from=renamefrom;
		renamefrom=-1;
		if(typeof keyboardmode!=="undefined" && keyboardmode && from>=0){
			const list=contextelements();
			if(list.length>0){ setfocus(list[Math.min(from,list.length-1)]); }
		}
	}
}

function openrename(appid) {
	const app=applist.filter((each) => each.id===appid)[0];
	if(!app){ return; }
	renameapp=appid;
	renamefrom=(settingsisopen() && typeof dpadfocus!=="undefined" && dpadfocus)?contextelements().indexOf(dpadfocus):-1;
	renametitle.textContent="Edit "+appdisplayname(app);
	renameoriginal.textContent=settings.names && settings.names[appid]?"Original name: "+app.title:"";
	showrenameicon(app);
	renameinput.value=appdisplayname(app);
	renamemessage.textContent="";
	renamereset.style.display=settings.names && settings.names[appid]?"":"none";
	maindiv.classList.add("renameopen");
	// with the remote OK on the box opens the keyboard; with the pointer it can open at once
	if(typeof keyboardmode!=="undefined" && keyboardmode){ setfocus(renameinput); } else { renameinput.focus(); }
}

function showrenameicon(app) {
	renameappicon.onerror=() => { renameappicon.onerror=null; renameappicon.src=appdir+"/access/fallback.png"; };
	renameappicon.src=appiconsrc(app);
	renameiconpick.style.display=rooted?"":"none";
	renameiconreset.style.display=settings.icons && settings.icons[app.id]?"":"none";
	renameiconrow.style.display=(rooted || (settings.icons && settings.icons[app.id]))?"":"none";
}

function saverename() {
	const name=renameinput.value.trim();
	if(name===""){
		renamemessage.textContent="Type a name, or use the original one.";
		return;
	}
	const appid=renameapp;
	setappname(appid,name);
	closerename();
	showmovetoast("Renamed to "+appdisplayname(applist.filter((each) => each.id===appid)[0]));
}

function resetrename() {
	const appid=renameapp;
	setappname(appid,"");
	closerename();
	showmovetoast("Back to "+appdisplayname(applist.filter((each) => each.id===appid)[0]));
}

// a picture file on the TV -> a small square icon (data: URL), or null if it can't be read
function makeicon(path) {
	return new Promise((resolve) => {
		const picture=new Image();
		picture.onload=() => {
			try {
				const canvas=document.createElement("canvas");
				canvas.width=ICON_SIZE;
				canvas.height=ICON_SIZE;
				const side=Math.min(picture.naturalWidth,picture.naturalHeight);
				if(!(side>0)){ resolve(null); return; }
				// the middle square of the picture
				const sx=(picture.naturalWidth-side)/2;
				const sy=(picture.naturalHeight-side)/2;
				const context=canvas.getContext("2d");
				context.imageSmoothingQuality="high";
				context.drawImage(picture,sx,sy,side,side,0,0,ICON_SIZE,ICON_SIZE);
				let icon=canvas.toDataURL("image/webp",0.9);
				if(icon.indexOf("data:image/webp")!==0){ icon=canvas.toDataURL("image/png"); }
				resolve(validicon(icon)?icon:null);
			} catch(e) {
				resolve(null);
			}
		};
		picture.onerror=() => resolve(null);
		picture.src=localfileurl(path);
	});
}

function pickrenameicon() {
	const appid=renameapp;
	if(!appid){ return; }
	openfilebrowser({
		title:"Choose an icon",
		kinds:["image"],
		onpick:async (path) => {
			renamemessage.textContent="Making the icon...";
			const icon=await makeicon(path);
			if(renameapp!==appid){ return; }
			if(!icon){
				renamemessage.textContent="Couldn't read that picture. Try a JPG or PNG.";
				return;
			}
			setappicon(appid,icon);
			renamemessage.textContent="Icon changed.";
			showrenameicon(applist.filter((each) => each.id===appid)[0]);
		}
	});
}

function resetrenameicon() {
	const appid=renameapp;
	if(!appid){ return; }
	setappicon(appid,null);
	renamemessage.textContent="Back to the app's own icon.";
	showrenameicon(applist.filter((each) => each.id===appid)[0]);
	if(typeof keyboardmode!=="undefined" && keyboardmode && rooted){ setfocus(renameiconpick); }
}

function initrename() {
	renameclose.innerHTML=iconsvg("close");
	renameclose.addEventListener("click",closerename);
	renamebackdrop.addEventListener("click",closerename);
	renamesave.addEventListener("click",saverename);
	renamereset.addEventListener("click",resetrename);
	renameiconpick.addEventListener("click",pickrenameicon);
	renameiconreset.addEventListener("click",resetrenameicon);
	renameinput.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ saverename(); }
	});
}

document.addEventListener("DOMContentLoaded",initrename);

// Settings > Apps > Names and icons: every app in the app menu (hidden ones too, dimmed), each opening its edit window
function renderappeditlist(box) {
	if(!applist){
		box.appendChild(el("div","sstatus","The app list is still loading."));
		return;
	}
	box.appendChild(el("div","sstatus","Pick an app to give it your own name or icon."+(rooted?"":" Your own icons need a rooted TV.")));
	const grid=el("div","appeditlist");
	orderedapps().forEach((app) => {
		const btn=el("button","sopt appeditbtn"+(ishidden(app.id)?" hiddenapp":""));
		const icon=document.createElement("img");
		icon.className="appediticon";
		icon.alt="";
		icon.setAttribute("loading","lazy");
		icon.src=appiconsrc(app);
		if(validcolor(app.iconColor)){ icon.style.backgroundColor=app.iconColor; }
		icon.addEventListener("error",() => { icon.src=appdir+"/access/fallback.png"; });
		btn.appendChild(icon);
		btn.appendChild(el("span","appeditname",appdisplayname(app)));
		const changed=(settings.names && settings.names[app.id]) || (settings.icons && settings.icons[app.id]);
		if(changed){
			const mark=el("span","appeditmark");
			mark.innerHTML=iconsvg("pencil");
			mark.setAttribute("title","Changed");
			btn.appendChild(mark);
		}
		btn.setAttribute("title",app.title);
		btn.addEventListener("click",() => openrename(app.id));
		grid.appendChild(btn);
	});
	box.appendChild(grid);
}
