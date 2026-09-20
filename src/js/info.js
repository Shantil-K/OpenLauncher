//SPDX-License-Identifier: WTFNMFPL
// The info button on the home screen and the "Now playing" card it opens: name and source of the wallpaper video,
// a seekbar you can drag, and Skip. What is playing comes from nowplaying() / skipvideo() in main.js.

let infotimer=null;
let infoseeking=false;

function fmttime(seconds){
	if(!isFinite(seconds) || seconds<0){ return "--:--"; }
	return Math.floor(seconds/60)+":"+pad2(Math.floor(seconds%60));
}

function updateinfo(){
	const playing=nowplaying();
	infoname.textContent=playing.name;
	infosource.textContent=playing.source;
	infoseekrow.style.display=playing.video?"":"none";
	if(!playing.video){ return; }
	const duration=bgvideo.duration;
	const known=isFinite(duration) && duration>0;
	infoseekbar.disabled=!known;
	if(!infoseeking){
		infoseekbar.value=known?Math.round(bgvideo.currentTime/duration*1000):0;
	}
	infoseekbar.style.setProperty("--seek",(infoseekbar.value/10)+"%");
	infotime.textContent=fmttime(bgvideo.currentTime)+" / "+fmttime(duration);
}

function infoisopen(){
	return maindiv.classList.contains("infoopen");
}

function openinfo(){
	updateinfo();
	maindiv.classList.add("infoopen");
	clearInterval(infotimer);
	infotimer=setInterval(updateinfo,500);
}

function closeinfo(){
	maindiv.classList.remove("infoopen");
	clearInterval(infotimer);
	infotimer=null;
	infoseeking=false;
}

function initinfo(){
	infobtn.innerHTML=iconsvg("info");
	infoskip.innerHTML=iconsvg("skip")+"<span>Skip video</span>";
	infobtn.addEventListener("click",() => {
		if(infoisopen()){ closeinfo(); } else { openinfo(); }
	});
	infoclose.addEventListener("click",closeinfo);
	infoskip.addEventListener("click",() => {
		skipvideo();
		updateinfo();
	});
	// dragging the seekbar seeks the video; the timer must not move the thumb back while it is held
	infoseekbar.addEventListener("mousedown",() => {infoseeking=true;});
	infoseekbar.addEventListener("input",() => {
		const duration=bgvideo.duration;
		if(isFinite(duration) && duration>0){ bgvideo.currentTime=infoseekbar.value/1000*duration; }
		infoseekbar.style.setProperty("--seek",(infoseekbar.value/10)+"%");
	});
	infoseekbar.addEventListener("change",() => {infoseeking=false;});
	infoseekbar.addEventListener("blur",() => {infoseeking=false;});
	// the drawer has its own buttons in that corner
	realappbarbtu.addEventListener("change",() => {
		if(realappbarbtu.checked){ closeinfo(); }
	});
}

document.addEventListener("DOMContentLoaded",initinfo);
