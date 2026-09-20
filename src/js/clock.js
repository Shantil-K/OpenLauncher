//SPDX-License-Identifier: WTFNMFPL
// Clock and date rendering. What to show and where comes from `prefs` (see settings.js).

const SVGNS="http://www.w3.org/2000/svg";

const DATE_FORMATS={
	"ymd-slash":(p) => p.y+"/"+p.mm+"/"+p.dd,
	"dmy-slash":(p) => p.dd+"/"+p.mm+"/"+p.y,
	"mdy-slash":(p) => p.mm+"/"+p.dd+"/"+p.y,
	"dmy-dash":(p) => p.dd+"-"+p.mm+"-"+p.y,
	"dmy-dot":(p) => p.dd+"."+p.mm+"."+p.y,
	"dmy-colon":(p) => p.dd+":"+p.mm+":"+p.y,
	"d-month-y":(p) => p.d+" "+p.month+" "+p.y,
	"month-d-y":(p) => p.month+" "+p.d+", "+p.y,
	"d-mon-y":(p) => p.d+" "+p.mon+" "+p.y
};

function pad2(n){
	return n<10?"0"+n:""+n;
}

// what the digital clock shows for a Date
function clockdisplay(now,hour12){
	let h=now.getHours();
	let suffix="";
	if(hour12){
		suffix=h>=12?"PM":"AM";
		h=h%12;
		if(h===0){ h=12; }
	}
	return {h:pad2(h),m:pad2(now.getMinutes()),s:pad2(now.getSeconds()),suffix};
}

// hand angles in degrees for the analog clock
function analogangles(now){
	const s=now.getSeconds();
	const m=now.getMinutes()+s/60;
	const h=(now.getHours()%12)+m/60;
	const round=(degrees) => Math.round(degrees*100)/100;
	return {h:round(h*30),m:round(m*6),s:round(s*6)};
}

// the text under/beside the clock for a Date: date, day of week, both or nothing
function datetext(now,p){
	let date="";
	if(p.dateShow){
		const format=DATE_FORMATS[p.dateFormat]||DATE_FORMATS["ymd-slash"];
		date=format({
			y:now.getFullYear(),
			mm:pad2(now.getMonth()+1),
			dd:pad2(now.getDate()),
			d:now.getDate(),
			month:now.toLocaleString(undefined,{month:"long"}),
			mon:now.toLocaleString(undefined,{month:"short"})
		});
	}
	const day=p.dayStyle==="off"?"":now.toLocaleString(undefined,{weekday:p.dayStyle});
	if(date && day){
		return p.dayPos==="after"?date+", "+day:day+", "+date;
	}
	return date||day;
}

function buildanalog(){
	const svgel=(tag,attrs) => {
		const e=document.createElementNS(SVGNS,tag);
		for(const k in attrs){ e.setAttribute(k,attrs[k]); }
		return e;
	};
	for(let i=0;i<60;i++){
		const hour=(i%5===0);
		const a=i*6*Math.PI/180;
		const inner=hour?80:87;
		clockticks.appendChild(svgel("line",{
			"class":"tick "+(hour?"hour":"minor"),
			x1:(100+inner*Math.sin(a)).toFixed(2),y1:(100-inner*Math.cos(a)).toFixed(2),
			x2:(100+94*Math.sin(a)).toFixed(2),y2:(100-94*Math.cos(a)).toFixed(2)
		}));
	}
	for(let n=1;n<=12;n++){
		const a=n*30*Math.PI/180;
		const label=svgel("text",{x:(100+65*Math.sin(a)).toFixed(2),y:(100-65*Math.cos(a)).toFixed(2)});
		label.textContent=n;
		clocknums.appendChild(label);
	}
}

// "top-left" -> data-v="top" data-h="left"
function setposition(layer,pos){
	const parts=pos.split("-");
	layer.setAttribute("data-v",parts[0]);
	layer.setAttribute("data-h",parts[1]);
}

let lastclock=null;
let lastdate=null;

function applyclock(p){
	clockstack.className="clockstyle-"+p.clockStyle+(p.clockSeconds?"":" noseconds")+(p.clockHour12?" hour12":"");
	setposition(clock,p.clockPos);
	// the date either sits under the clock or on its own layer somewhere else on screen
	const together=(p.datePos==="with-clock");
	(together?clockstack:datelayer).appendChild(clockdate);
	setposition(datelayer,together?p.clockPos:p.datePos);
	datelayer.style.display=together?"none":"";
	lastclock=null;
	lastdate=null;
	tickclock();
}

function tickclock(){
	const now=new Date();
	const style=prefs.clockStyle;
	if(style==="analog" || style==="analogmin"){
		const a=analogangles(now);
		const key=a.h+"|"+a.m+"|"+a.s;
		if(key!==lastclock){
			lastclock=key;
			clockhh.setAttribute("transform","rotate("+a.h+" 100 100)");
			clockhm.setAttribute("transform","rotate("+a.m+" 100 100)");
			clockhs.setAttribute("transform","rotate("+a.s+" 100 100)");
		}
	} else if(style!=="off"){
		const d=clockdisplay(now,prefs.clockHour12);
		const key=d.h+d.m+d.s+d.suffix;
		if(key!==lastclock){
			lastclock=key;
			clockh.textContent=d.h;
			clockm.textContent=d.m;
			clocks.textContent=d.s;
			clockap.textContent=d.suffix;
		}
	}
	const text=datetext(now,prefs);
	if(text!==lastdate){
		lastdate=text;
		clockdate.textContent=text;
		clockdate.style.display=text?"":"none";
	}
}

function startclock(){
	buildanalog();
	setInterval(tickclock,1000);
}
