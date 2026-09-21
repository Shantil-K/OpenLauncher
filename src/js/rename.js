//SPDX-License-Identifier: WTFNMFPL
// The window Rename opens (Edit mode: an app's pencil button, or "Rename..." in the OK menu): the app's icon and its original
// name, a text box with the name it has now, Save, and "Use the original name". The names live in `settings.names` (main.js).

let renameapp=null;        // id of the app being renamed

function renameopen() {
	return maindiv.classList.contains("renameopen");
}

function closerename() {
	renameapp=null;
	maindiv.classList.remove("renameopen");
	renamemessage.textContent="";
}

function openrename(appid) {
	const app=applist.filter((each) => each.id===appid)[0];
	if(!app){ return; }
	renameapp=appid;
	renametitle.textContent="Rename "+appdisplayname(app);
	renameoriginal.textContent=settings.names && settings.names[appid]?"Original name: "+app.title:"";
	renameappicon.src=appiconsrc(app);
	renameappicon.onerror=() => { renameappicon.onerror=null; renameappicon.src=appdir+"/access/fallback.png"; };
	renameinput.value=appdisplayname(app);
	renamemessage.textContent="";
	renamereset.style.display=settings.names && settings.names[appid]?"":"none";
	maindiv.classList.add("renameopen");
	// with the remote OK on the box opens the keyboard; with the pointer it can open at once
	if(typeof keyboardmode!=="undefined" && keyboardmode){ setfocus(renameinput); } else { renameinput.focus(); }
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

function initrename() {
	renameclose.innerHTML=iconsvg("close");
	renameclose.addEventListener("click",closerename);
	renamebackdrop.addEventListener("click",closerename);
	renamesave.addEventListener("click",saverename);
	renamereset.addEventListener("click",resetrename);
	renameinput.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ saverename(); }
	});
}

document.addEventListener("DOMContentLoaded",initrename);
