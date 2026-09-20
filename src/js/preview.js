//SPDX-License-Identifier: WTFNMFPL
// Live previews shown beside the Settings rows: a miniature screen with the clock, date and weather where they are set to
// go, and miniature tiles at the sizes chosen for the bottom bar and the app menu. Everything is drawn again after every
// change (renderpane() in settings.js), sizes come from the same CSS variables the real screen uses, and nothing in a
// preview can be focused or clicked.

// which preview a Settings tab gets: "screen" is the clock/date/weather one, "tiles" the bar and menu one
const PREVIEW_FOR_TAB={clock:"screen",date:"screen",weather:"screen",apps:"tiles"};
const PREVIEW_MENU_TILES=40;        // enough to fill the miniature menu at any size
const PREVIEW_BAR_TILES=6;
const PREVIEW_TEMPERATURE={c:"21°C",f:"70°F"};

// always the same time, so the hands of an analog clock look right
function previewnow(){
	const now=new Date();
	now.setHours(10,10,35,0);
	return now;
}

function previewclock(p,now){
	const style=p.clockStyle;
	if(style==="off"){ return null; }
	if(style==="analog" || style==="analogmin"){
		const angle=analogangles(now);
		let marks="";
		for(let i=0;i<12;i++){
			marks+='<line x1="100" y1="10" x2="100" y2="'+(i%3===0?"26":"20")+'" transform="rotate('+(i*30)+' 100 100)"/>';
		}
		const box=el("div","pvanalog");
		box.innerHTML='<svg viewBox="0 0 200 200"><circle class="pvface" cx="100" cy="100" r="96"/><g class="pvmarks">'+marks+'</g>'+
			'<line class="pvhand" x1="100" y1="100" x2="100" y2="56" transform="rotate('+angle.h+' 100 100)"/>'+
			'<line class="pvhand thin" x1="100" y1="100" x2="100" y2="30" transform="rotate('+angle.m+' 100 100)"/>'+
			(p.clockSeconds?'<line class="pvsecond" x1="100" y1="110" x2="100" y2="22" transform="rotate('+angle.s+' 100 100)"/>':"")+
			'<circle class="pvhub" cx="100" cy="100" r="6"/></svg>';
		return box;
	}
	const time=clockdisplay(now,p.clockHour12);
	const box=el("div","pvtime"+(style==="stacked"?" stacked":""));
	if(style==="stacked"){
		box.appendChild(el("span","",time.h));
		box.appendChild(el("span","",time.m));
		if(p.clockSeconds){ box.appendChild(el("small","",time.s+(time.suffix?" "+time.suffix:""))); }
		else if(time.suffix){ box.appendChild(el("small","",time.suffix)); }
	} else {
		box.appendChild(el("span","",time.h+":"+time.m+(p.clockSeconds?":"+time.s:"")+(time.suffix?" "+time.suffix:"")));
	}
	return box;
}

function previewweather(p){
	const box=el("div","pvweather");
	const icon=el("span","pvweathericon");
	icon.innerHTML=iconsvg("partday");
	box.appendChild(icon);
	box.appendChild(el("span","",PREVIEW_TEMPERATURE[p.weatherUnit] || PREVIEW_TEMPERATURE.c));
	return box;
}

function previewtile(name,hot){
	const tile=el("div","pvtile"+(hot?" hot":""));
	tile.appendChild(el("span","pvicon"));
	if(name){ tile.appendChild(el("span","pvname")); }
	return tile;
}

// a row of miniature bar tiles, sized by the bar's setting
function previewbar(p,recent){
	const bar=el("div","pvbar"+(p.barNames?"":" nonames"));
	for(let i=0;i<PREVIEW_BAR_TILES;i++){
		bar.appendChild(previewtile(p.barNames,i===1));
	}
	if(!recent){ return bar; }
	const wrap=el("div","pvbars");
	const row=el("div","pvbar pvrecent"+(p.barNames?"":" nonames"));
	for(let i=0;i<Math.min(p.recentCount,PREVIEW_BAR_TILES);i++){
		row.appendChild(previewtile(p.barNames,false));
	}
	wrap.appendChild(row);
	wrap.appendChild(bar);
	return wrap;
}

// the miniature home screen
function previewscreen(p){
	const screen=el("div","pvscreen");
	const now=previewnow();
	const cells={};
	const put=(pos,node) => {
		if(!node){ return; }
		if(!cells[pos]){
			const parts=pos.split("-");
			const cell=el("div","pvlayer");
			cell.setAttribute("data-v",parts[0]);
			cell.setAttribute("data-h",parts[1]);
			cells[pos]=cell;
			screen.appendChild(cell);
		}
		cells[pos].appendChild(node);
	};
	put(p.clockPos,previewclock(p,now));
	const date=datetext(now,p);
	if(date){ put(p.datePos==="with-clock"?p.clockPos:p.datePos,el("div","pvdate",date)); }
	if(p.weatherShow){ put(p.weatherPos==="with-clock"?p.clockPos:p.weatherPos,previewweather(p)); }
	screen.appendChild(previewbar({barNames:p.barNames,recentCount:p.recentCount},p.recentShow));
	screen.classList.toggle("hasrecent",p.recentShow);
	return screen;
}

// the miniature bar (and recent row), and the miniature app menu
function previewtiles(p){
	const box=el("div","pvtiles");
	const barscreen=el("div","pvscreen pvsmall"+(p.barNames?"":" nonames"));
	barscreen.appendChild(previewbar(p,p.recentShow));
	box.appendChild(barscreen);
	const menu=el("div","pvscreen pvmenu"+(p.menuNames?"":" nonames"));
	const grid=el("div","pvgrid");
	for(let i=0;i<PREVIEW_MENU_TILES;i++){ grid.appendChild(previewtile(p.menuNames,i===1)); }
	menu.appendChild(grid);
	box.appendChild(menu);
	return box;
}

// fills #settingspreview for the open tab, or hides it when the tab has no preview
function renderpreview(){
	const kind=PREVIEW_FOR_TAB[settingstab];
	settingspreview.innerHTML="";
	settingspreview.classList.toggle("on",!!kind);
	if(kind==="screen"){ settingspreview.appendChild(previewscreen(prefs)); }
	if(kind==="tiles"){ settingspreview.appendChild(previewtiles(prefs)); }
}
