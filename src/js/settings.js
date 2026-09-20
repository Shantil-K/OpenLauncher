//SPDX-License-Identifier: WTFNMFPL
// Settings: the schema below describes every setting, and the panel, saving and defaults are all generated from it.
//
// To add a setting:
//   1. add an item to a section in SETTINGS_SCHEMA (or add a whole section, it becomes a tab)
//   2. make applyprefs() react to its `key` (a CSS variable, a class on #maindiv, ...)
//
// Item fields:
//   key      name in `prefs` (saved in localStorage)      default   value used until the user changes it
//   label    text shown in the panel                      hint      optional small text under the label
//   type     "choice"   a row of buttons, `options` is a list of [value, label]
//            "swatch"   a row of colour dots, `options` is a list of [value, label], value is "r,g,b"
//            "position" a 3x3 grid of screen positions ("top-left" ... "bottom-right"); withClock adds "with-clock"
//            "action"   one button (`button` is its text) that calls run(); add `confirm` (a question) and `confirmButton`
//                       to ask "are you sure?" first, with a Cancel
//   show     optional function(prefs) returning false to hide the row while it doesn't apply

const PREFS_KEY='openlauncher.prefs';

const ON_OFF=[[true,"On"],[false,"Off"]];

const SETTINGS_SCHEMA=[
	{id:"clock",title:"Clock",items:[
		{key:"clockStyle",label:"Style",type:"choice",default:"digital",options:[["digital","Digital"],["stacked","Stacked"],["analog","Analog"],["analogmin","Analog minimal"],["off","Off"]]},
		{key:"clockSeconds",label:"Seconds",type:"choice",default:true,options:ON_OFF,show:(p) => p.clockStyle!=="off"},
		{key:"clockHour12",label:"Hours",type:"choice",default:false,options:[[false,"24-hour"],[true,"12-hour"]],show:(p) => p.clockStyle==="digital" || p.clockStyle==="stacked"},
		{key:"clockPos",label:"Position",type:"position",default:"center-center"}
	]},
	{id:"date",title:"Date",items:[
		{key:"dateShow",label:"Date",type:"choice",default:true,options:ON_OFF,hint:"Turn Date and Day of week both off to hide it completely"},
		{key:"dateFormat",label:"Format",type:"choice",default:"ymd-slash",show:(p) => p.dateShow,options:[
			["ymd-slash","YYYY/MM/DD"],["dmy-slash","DD/MM/YYYY"],["mdy-slash","MM/DD/YYYY"],["dmy-dash","DD-MM-YYYY"],["dmy-dot","DD.MM.YYYY"],["dmy-colon","DD:MM:YYYY"],
			["d-month-y","DD Month YYYY"],["month-d-y","Month DD, YYYY"],["d-mon-y","DD Mon YYYY"]]},
		{key:"dayStyle",label:"Day of week",type:"choice",default:"off",options:[["off","Off"],["short","Short"],["long","Full"]]},
		{key:"dayPos",label:"Day goes",type:"choice",default:"before",options:[["before","Before date"],["after","After date"]],show:(p) => p.dateShow && p.dayStyle!=="off"},
		{key:"datePos",label:"Position",type:"position",default:"with-clock",withClock:true,show:(p) => p.dateShow || p.dayStyle!=="off"}
	]},
	{id:"apps",title:"Apps",items:[
		{key:"barSize",label:"Bottom bar size",type:"choice",default:5,options:[[4,"Small"],[5,"Medium"],[6,"Large"],[7,"Extra large"]]},
		{key:"menuSize",label:"App menu size",type:"choice",default:5,options:[[4,"Small"],[5,"Medium"],[6,"Large"],[7.5,"Extra large"]]},
		{key:"barNames",label:"Names in bar",type:"choice",default:true,options:ON_OFF},
		{key:"barNameSize",label:"Name size in bar",type:"choice",default:1.5,options:[[1.2,"Small"],[1.5,"Medium"],[1.9,"Large"],[2.3,"Extra large"]],show:(p) => p.barNames},
		{key:"menuNames",label:"Names in menu",type:"choice",default:true,options:ON_OFF},
		{key:"menuNameSize",label:"Name size in menu",type:"choice",default:1.5,options:[[1.2,"Small"],[1.5,"Medium"],[1.9,"Large"],[2.3,"Extra large"]],show:(p) => p.menuNames},
		{key:"accent",label:"Hover colour",type:"swatch",default:"255,150,255",options:[
			["255,150,255","Pink"],["255,90,90","Red"],["255,160,60","Orange"],["255,215,80","Yellow"],["110,220,120","Green"],
			["80,220,230","Cyan"],["90,170,255","Blue"],["170,120,255","Purple"],["255,255,255","White"]]}
	]},
	{id:"wallpaper",title:"Wallpaper",items:[
		{key:"videoSource",label:"Video source",type:"choice",default:"online",options:[["online","Online (streamed)"],["offline","Offline (built in)"]],
			hint:"Online streams about 2.7 GB per hour. Offline plays the video built into the launcher."}
	]},
	{id:"tv",title:"TV",items:[
		{type:"action",label:"TV settings",hint:"Opens the TV's own settings",button:"Open",run:() => launchapp("com.palm.app.settings")},
		{type:"action",label:"Launcher settings",hint:"Put every setting on this screen back to its default",button:"Reset",confirm:"Are you sure?",confirmButton:"Yes, reset",run:() => resetprefs()}
	]}
];

const PREF_DEFAULTS={};
SETTINGS_SCHEMA.forEach((section) => section.items.forEach((item) => {
	if(item.key){ PREF_DEFAULTS[item.key]=item.default; }
}));

let prefs=Object.assign({},PREF_DEFAULTS);
let settingstab=SETTINGS_SCHEMA[0].id;
let confirming=null;   // the action item waiting for "are you sure?"

const POSITION_RE=/^(top|center|bottom)-(left|center|right)$/;

// a saved value only counts if the schema still offers it
function validpref(item,value){
	if(item.type==="position"){
		return POSITION_RE.test(value) || (item.withClock===true && value==="with-clock");
	}
	if(item.options){
		return item.options.some((option) => option[0]===value);
	}
	return false;
}

function loadprefs(){
	prefs=Object.assign({},PREF_DEFAULTS);
	try {
		const saved=JSON.parse(localStorage.getItem(PREFS_KEY));
		if(saved){
			SETTINGS_SCHEMA.forEach((section) => section.items.forEach((item) => {
				if(item.key && (item.key in saved) && validpref(item,saved[item.key])){ prefs[item.key]=saved[item.key]; }
			}));
		}
	} catch(e) {}
}

// only what differs from the defaults is stored, so new defaults reach people who never changed a setting
function saveprefs(){
	const changed={};
	for(const key in prefs){
		if(prefs[key]!==PREF_DEFAULTS[key]){ changed[key]=prefs[key]; }
	}
	try {
		localStorage.setItem(PREFS_KEY,JSON.stringify(changed));
	} catch(e) {}
}

function setpref(key,value){
	prefs[key]=value;
	saveprefs();
	applyprefs();
	renderpane();
}

function resetprefs(){
	prefs=Object.assign({},PREF_DEFAULTS);
	saveprefs();
	applyprefs();
	renderpane();
}

// CSS variables that depend on the prefs and on the screen shape; also run when the window is resized
function applysizes(){
	const root=document.documentElement.style;
	root.setProperty("--accent",prefs.accent);
	root.setProperty("--bartile",prefs.barSize+"vw");
	root.setProperty("--menutile",prefs.menuSize+"vw");
	root.setProperty("--barname",prefs.barNameSize+"vh");
	root.setProperty("--menuname",prefs.menuNameSize+"vh");
	// Sizes below are estimates in vh/vw of what a tile needs: a tile is about as tall as it is wide, plus its name
	// (about 3.35x the name's font size once margins are counted). vw -> vh goes through the aspect ratio.
	// A TV can report a 0x0 window while starting up, so fall back to 16:9 instead of dividing by zero.
	const aspect=(window.innerWidth>0 && window.innerHeight>0)?window.innerWidth/window.innerHeight:16/9;
	const namesvh=(names,size) => names?size*3.35:0;
	// the bar grows with its tiles
	const barheight=Math.max(15,prefs.barSize*aspect*1.05+namesvh(prefs.barNames,prefs.barNameSize));
	root.setProperty("--barh",(Math.round(barheight*10)/10)+"vh");
	// grid rows are normally 2x a tile's width tall; bigger names need more, no names need less
	const rowfor=(tile,names,size) => names?Math.max(2,Math.round((1+namesvh(true,size)/aspect/tile+0.43)*100)/100):1.5;
	root.setProperty("--barrow",String(rowfor(prefs.barSize,prefs.barNames,prefs.barNameSize)));
	root.setProperty("--menurow",String(rowfor(prefs.menuSize,prefs.menuNames,prefs.menuNameSize)));
}

// make the launcher match `prefs`
function applyprefs(){
	applysizes();
	maindiv.classList.toggle("hide-bar-names",!prefs.barNames);
	maindiv.classList.toggle("hide-menu-names",!prefs.menuNames);
	applyclock(prefs);
	applybackgroundsource();
}

// ---- panel

function el(tag,cls,text){
	const e=document.createElement(tag);
	if(cls){ e.className=cls; }
	if(text!==undefined){ e.textContent=text; }
	return e;
}

function optionbutton(label,selected,onclick){
	const btn=el("button","sopt"+(selected?" on":""),label);
	btn.addEventListener("click",onclick);
	return btn;
}

const POSITION_NAMES={top:"Top",center:"Middle",bottom:"Bottom",left:"left",right:"right"};

function positionpicker(item){
	const box=el("div","pospicker");
	if(item.withClock){
		box.appendChild(optionbutton("With the clock",prefs[item.key]==="with-clock",() => setpref(item.key,"with-clock")));
	}
	const grid=el("div","posgrid");
	["top","center","bottom"].forEach((v) => ["left","center","right"].forEach((h) => {
		const value=v+"-"+h;
		const cell=el("button","poscell"+(prefs[item.key]===value?" on":""));
		cell.setAttribute("title",(v==="center" && h==="center")?"Centre":POSITION_NAMES[v]+" "+(h==="center"?"centre":POSITION_NAMES[h]));
		cell.addEventListener("click",() => setpref(item.key,value));
		grid.appendChild(cell);
	}));
	box.appendChild(grid);
	return box;
}

function controlfor(item){
	const box=el("div","scontrol");
	if(item.type==="choice"){
		item.options.forEach((option) => box.appendChild(optionbutton(option[1],prefs[item.key]===option[0],() => setpref(item.key,option[0]))));
	} else if(item.type==="swatch"){
		item.options.forEach((option) => {
			const dot=el("button","swatch"+(prefs[item.key]===option[0]?" on":""));
			dot.style.backgroundColor="rgb("+option[0]+")";
			dot.setAttribute("title",option[1]);
			dot.addEventListener("click",() => setpref(item.key,option[0]));
			box.appendChild(dot);
		});
	} else if(item.type==="position"){
		box.appendChild(positionpicker(item));
	} else if(item.type==="action"){
		if(item.confirm && confirming===item){
			box.appendChild(el("span","sconfirm",item.confirm));
			const yes=optionbutton(item.confirmButton||"Yes",false,() => {
				confirming=null;
				item.run();
				renderpane();
			});
			yes.classList.add("action","danger");
			box.appendChild(yes);
			box.appendChild(optionbutton("Cancel",false,() => {
				confirming=null;
				renderpane();
			}));
		} else {
			const btn=optionbutton(item.button,false,() => {
				if(item.confirm){
					confirming=item;
					renderpane();
				} else {
					item.run();
				}
			});
			btn.classList.add("action");
			box.appendChild(btn);
		}
	}
	return box;
}

function renderpane(){
	const section=SETTINGS_SCHEMA.filter((s) => s.id===settingstab)[0];
	settingstabs.innerHTML="";
	SETTINGS_SCHEMA.forEach((s) => {
		const tab=el("button","stab"+(s.id===settingstab?" on":""),s.title);
		tab.addEventListener("click",() => {
			confirming=null;
			settingstab=s.id;
			settingspane.scrollTop=0;
			renderpane();
		});
		settingstabs.appendChild(tab);
	});
	settingspane.innerHTML="";
	section.items.forEach((item) => {
		if(item.show && !item.show(prefs)){ return; }
		const row=el("div","srow");
		const label=el("div","slabel");
		label.appendChild(el("span","slabeltext",item.label));
		if(item.hint){ label.appendChild(el("small","shint",item.hint)); }
		row.appendChild(label);
		row.appendChild(controlfor(item));
		settingspane.appendChild(row);
	});
}

function settingsisopen(){
	return maindiv.classList.contains("settingsopen");
}

function opensettings(){
	renderpane();
	maindiv.classList.add("settingsopen");
}

function closesettings(){
	confirming=null;
	maindiv.classList.remove("settingsopen");
}

function initsettings(){
	loadprefs();
	startclock();
	applyprefs();
	settingsbtn.addEventListener("click",opensettings);
	settingsclose.addEventListener("click",closesettings);
	settingsbackdrop.addEventListener("click",closesettings);
	window.addEventListener("resize",applysizes);
}

document.addEventListener("DOMContentLoaded",initsettings);
