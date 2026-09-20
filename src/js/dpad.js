//SPDX-License-Identifier: WTFNMFPL
// Remote control (D-pad) navigation. Arrow keys move a focus ring (.dfocus) to the nearest item in that direction,
// OK activates it, Back goes up a level. Moving the mouse switches back to pointer mode.
//
// Focus is virtual (a class), not DOM focus, except in text boxes: OK on one focuses it so the on-screen keyboard
// opens, and while typing the keys belong to the text box until Back.
// In Edit mode OK on an app opens a small menu (pin, hide, folder, reorder); Reorder then moves it with the arrows.

const KEY_LEFT=37;
const KEY_UP=38;
const KEY_RIGHT=39;
const KEY_DOWN=40;
const KEY_ENTER=13;
const KEY_BACK=461;
// the coloured buttons are shortcuts: the gear and Edit buttons are far from the app grid
const KEY_RED=403;      // info card
const KEY_YELLOW=405;   // settings
const KEY_BLUE=406;     // Edit mode
const SEEK_STEP=20;          // seekbar units (of 1000) per Left/Right press: 2%
const MOUSE_SWITCH_PX=10;    // a pointer jitter smaller than this doesn't cancel keyboard mode

let dpadfocus=null;
let lastactivation=null;     // {context, index}: which item OK was pressed on, so its rebuilt twin can be re-focused
let returnto=null;           // the item that opened whatever is on screen now: focus goes back to it when that closes
let keyboardmode=false;
let mousex=0;
let mousey=0;
let anchorx=0;
let anchory=0;

// ---- choosing the neighbour (pure geometry, so it can be tested with plain rectangles)
// rects are {left, top, width, height}; returns the index of the best candidate in `key`'s direction, or -1.
// A candidate only counts if it lies beyond the edge of the current item in that direction (something in the same row is
// not "below"); among those, items in line beat closer ones off to the side.
const EDGE_TOLERANCE=2;

function pickneighbor(from,candidates,key) {
	const fx=from.left+from.width/2;
	const fy=from.top+from.height/2;
	let best=-1;
	let bestscore=Infinity;
	candidates.forEach((rect,index) => {
		const dx=rect.left+rect.width/2-fx;
		const dy=rect.top+rect.height/2-fy;
		let beyond;
		let along;
		let across;
		if(key===KEY_RIGHT){ beyond=rect.left>=from.left+from.width-EDGE_TOLERANCE; along=dx; across=dy; }
		else if(key===KEY_LEFT){ beyond=rect.left+rect.width<=from.left+EDGE_TOLERANCE; along=-dx; across=dy; }
		else if(key===KEY_DOWN){ beyond=rect.top>=from.top+from.height-EDGE_TOLERANCE; along=dy; across=dx; }
		else { beyond=rect.top+rect.height<=from.top+EDGE_TOLERANCE; along=-dy; across=dx; }
		if(!beyond || along<=0){ return; }
		const score=along+Math.abs(across)*2.5;
		if(score<bestscore){
			bestscore=score;
			best=index;
		}
	});
	return best;
}

// ---- what can be focused right now: the topmost thing on screen
function isvisible(el) {
	if(!el.getClientRects || el.getClientRects().length===0){ return false; }
	const style=getComputedStyle(el);
	return style.visibility!=="hidden" && style.display!=="none" && !el.disabled;
}

function within(root,selector) {
	return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(isvisible);
}

function appmenuopen() {
	return maindiv.classList.contains("menuopen");
}

function contextname() {
	if(folderpickeropen()){ return "picker"; }
	if(appmenuopen()){ return "menu"; }
	if(settingsisopen()){ return "settings"; }
	if(infoisopen()){ return "info"; }
	return realappbarbtu.checked?"drawer":"home";
}

function contextelements() {
	if(folderpickeropen()){ return within(folderpicker,"button, input"); }
	if(appmenuopen()){ return within(appmenu,"button"); }
	if(settingsisopen()){ return within(settingspanel,"button, input, textarea"); }
	if(infoisopen()){ return within(infocard,"button, input"); }
	if(realappbarbtu.checked){
		return within(appluncher,".appitem").concat([settingsbtn,editbtn].filter(isvisible),within(appbar,".appitem"));
	}
	return within(appbar,".appitem").concat(within(recentrow,".appitem"),[infobtn].filter(isvisible));
}

// ---- focus
function reveal(el) {
	[appluncher,settingspane,folderpicker].forEach((scroller) => {
		if(!scroller.contains(el)){ return; }
		const box=scroller.getBoundingClientRect();
		const rect=el.getBoundingClientRect();
		const margin=box.height*0.05;
		if(rect.top<box.top+margin){ scroller.scrollTop-=box.top+margin-rect.top; }
		else if(rect.bottom>box.bottom-margin){ scroller.scrollTop+=rect.bottom-(box.bottom-margin); }
	});
}

function setfocus(el) {
	if(dpadfocus){ dpadfocus.classList.remove("dfocus"); }
	dpadfocus=el;
	if(el){
		el.classList.add("dfocus");
		reveal(el);
	}
}

function clearfocus() {
	setfocus(null);
	returnto=null;
	keyboardmode=false;
}

// where focus starts: the Apps button at home, the first app in the drawer, the selected tab in settings, ...
function defaultfocus(list) {
	if(settingsisopen()){
		const tab=list.filter((el) => el.classList.contains("stab") && el.classList.contains("on"))[0];
		if(tab){ return tab; }
	}
	if(folderpickeropen()){
		// start on the list (on the folder the app is in, if it is in one), not on the close button in the corner
		const choices=list.filter((el) => folderlist.contains(el));
		return choices.filter((el) => el.classList.contains("on"))[0] || choices[0] || list[0] || null;
	}
	if(appmenuopen() || infoisopen()){ return list[0] || null; }
	if(realappbarbtu.checked){ return within(appluncher,".appitem")[0] || list[0] || null; }
	return list[0] || null;
}

// after something opened or closed (a panel, a menu, the drawer): if the focus ring is gone from the screen,
// put it back where we came from, or on the first item of what is showing now
function settle() {
	if(!keyboardmode){ return; }
	const list=contextelements();
	if(list.length===0 || (dpadfocus && list.indexOf(dpadfocus)!==-1)){ return; }
	// the panel was rebuilt under us (changing a setting redraws its controls): focus the control in the same place
	const activation=lastactivation;
	lastactivation=null;
	if(activation && activation.context===contextname() && activation.index>=0){
		setfocus(list[Math.min(activation.index,list.length-1)]);
		return;
	}
	const back=returnto && list.indexOf(returnto)!==-1?returnto:null;
	if(back){ returnto=null; }     // used up; otherwise keep it for when we get back to where it lives
	setfocus(back || defaultfocus(list));
}

function istextbox(el) {
	return !!el && (el.tagName==="TEXTAREA" || (el.tagName==="INPUT" && (el.type==="text" || el.type==="search")));
}

function istyping() {
	return istextbox(document.activeElement);
}

// ---- the menu OK opens on an app in Edit mode
function closeappmenu() {
	maindiv.classList.remove("menuopen");
}

function openappmenu(tile) {
	const id=tile.getAttribute("data-appid");
	returnto=tile;
	const inbar=appbar.contains(tile);
	const app=applist.filter((each) => each.id===id)[0];
	appmenutitle.textContent=app?app.title:id;
	appmenulist.innerHTML="";
	const add=(label,action) => {
		const button=el("button","sopt",label);
		button.addEventListener("click",() => {
			closeappmenu();
			action();
		});
		appmenulist.appendChild(button);
	};
	add(ispinned(id)?"Unpin from the bar":"Pin to the bar",() => togglepin(id));
	if(!inbar){
		add(ishidden(id)?"Show":"Hide",() => togglehide(id));
		add("Move to folder...",() => openfolderpicker(id));
	}
	add("Reorder",() => {
		startcarry(id,inbar);
		carryhint.textContent="Arrow keys move it. OK drops it.";
		setfocus(tile);
	});
	maindiv.classList.add("menuopen");
	setfocus(within(appmenu,"button")[0] || null);
}

// ---- carrying an app: arrows move it
function carriedtile() {
	const box=carrying.inbar?appbar:appluncher;
	return within(box,".appitem").filter((tile) => tile.getAttribute("data-appid")===carrying.id)[0] || null;
}

function movecarriedbykey(key) {
	const tile=carriedtile();
	if(!tile){ return; }
	const box=carrying.inbar?appbar:appluncher;
	const others=within(box,".appitem").filter((each) => each!==tile && each.getAttribute("data-appid"));
	const index=pickneighbor(tile.getBoundingClientRect(),others.map((each) => each.getBoundingClientRect()),key);
	if(index!==-1){ movecarried(others[index].getAttribute("data-appid")); }
	const moved=carriedtile();      // the same tile object, in its new place
	if(moved){ setfocus(moved); }
}

// ---- keys
function handleback() {
	if(istyping()){
		document.activeElement.blur();
	} else if(carrying){
		stopcarry();
	} else if(appmenuopen()){
		closeappmenu();
	} else if(folderpickeropen()){
		closefolderpicker();
	} else if(settingsisopen()){
		closesettings();
	} else if(infoisopen()){
		closeinfo();
	} else if(realappbarbtu.checked && openfolder!==null){
		openfolder=null;
		render();
		appluncher.scrollTop=0;
	} else {
		realappbarbtu.click();
	}
	settle();
}

function activate(el) {
	// only a press on the screen underneath sets where to come back to; buttons inside a menu or panel are about to vanish
	if(!appmenuopen() && !folderpickeropen() && !settingsisopen() && !infoisopen()){ returnto=el; }
	// folder tiles replace the whole list, so there is no "same place" to come back to
	lastactivation=el.classList.contains("foldertile")?null:{context:contextname(),index:contextelements().indexOf(el)};
	if(istextbox(el)){
		el.focus();
	} else if(editing && el.classList.contains("appitem") && el.getAttribute("data-appid")){
		openappmenu(el);
	} else {
		el.click();
	}
	settle();
	lastactivation=null;
}

// coloured buttons: click the matching button, whatever is showing, and close it again if it is already open
function shortcut(code) {
	if(code===KEY_YELLOW){
		if(settingsisopen()){ closesettings(); } else { settingsbtn.click(); }
	} else if(code===KEY_RED){
		if(infoisopen()){ closeinfo(); } else if(!realappbarbtu.checked && !settingsisopen()){ infobtn.click(); }
	} else if(code===KEY_BLUE){
		if(realappbarbtu.checked && !settingsisopen()){ editbtn.click(); }
	}
	settle();
}

function onkey(event) {
	const code=event.keyCode;
	if(code===KEY_BACK){
		handleback();
		return;
	}
	if(code===KEY_RED || code===KEY_YELLOW || code===KEY_BLUE){
		if(!istyping()){
			event.preventDefault();
			keyboardmode=true;
			shortcut(code);
		}
		return;
	}
	if(code!==KEY_LEFT && code!==KEY_UP && code!==KEY_RIGHT && code!==KEY_DOWN && code!==KEY_ENTER){ return; }
	if(istyping()){ return; }     // typing: arrows and OK belong to the text box (Back leaves it)
	event.preventDefault();
	const entering=!keyboardmode;
	keyboardmode=true;
	anchorx=mousex;
	anchory=mousey;
	const list=contextelements();
	if(list.length===0){ return; }
	if(!dpadfocus || list.indexOf(dpadfocus)===-1){
		// nothing (visible) is focused: this key press only shows the focus ring
		settle();
		return;
	}
	if(entering){
		setfocus(dpadfocus);
		return;
	}
	if(carrying){
		if(code===KEY_ENTER){ stopcarry(); } else { movecarriedbykey(code); }
		return;
	}
	if(code===KEY_ENTER){
		activate(dpadfocus);
		return;
	}
	if(dpadfocus.tagName==="INPUT" && dpadfocus.type==="range" && (code===KEY_LEFT || code===KEY_RIGHT)){
		const step=code===KEY_RIGHT?SEEK_STEP:-SEEK_STEP;
		dpadfocus.value=Math.max(0,Math.min(1000,Number(dpadfocus.value)+step));
		dpadfocus.dispatchEvent(new Event("input"));
		return;
	}
	const others=list.filter((each) => each!==dpadfocus);
	const index=pickneighbor(dpadfocus.getBoundingClientRect(),others.map((each) => each.getBoundingClientRect()),code);
	if(index!==-1){ setfocus(others[index]); }
}

function onmouse(event) {
	mousex=event.clientX;
	mousey=event.clientY;
	if(keyboardmode && Math.abs(mousex-anchorx)+Math.abs(mousey-anchory)>MOUSE_SWITCH_PX){ clearfocus(); }
}

function initdpad() {
	// opening the drawer moves focus to its first app; closing it goes back to what opened it (the Apps button)
	realappbarbtu.addEventListener("change",() => {
		if(!keyboardmode){ return; }
		const list=contextelements();
		setfocus(realappbarbtu.checked?defaultfocus(list):(returnto && list.indexOf(returnto)!==-1?returnto:list[0] || null));
	});
	window.addEventListener("keydown",onkey);
	window.addEventListener("mousemove",onmouse,true);
	window.addEventListener("mousedown",() => { if(keyboardmode){ clearfocus(); } },true);
}

document.addEventListener("DOMContentLoaded",initdpad);
