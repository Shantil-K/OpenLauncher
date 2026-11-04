//SPDX-License-Identifier: WTFNMFPL
// Running apps: the apps the TV keeps open in the background, and closing them (one, or all) to free memory. Opens with the
// green button, or the "Running apps" button next to Edit in the app menu. It uses the same small window as the Edit-mode
// app menu (dpad.js), so the remote already knows how to move around it.
//
// The list comes from the application manager's "running" call (root, or a trusted app). Only full-screen apps ("card"
// windows) are listed: overlays like the voice assistant, LG's own Home and the launcher itself are left out.

const RUNNING_HIDDEN=["com.webos.app.home"];
const RUNNING_SETTLE_MS=700;      // the TV takes a moment to drop a closed app from its list

function runningcall(url,payload){
	return (rooted?lunacallasroot:lunacall)(url,payload);
}

async function runningapps(){
	let result;
	try {
		result=await runningcall('luna://com.webos.applicationManager/running',{});
	} catch(e) {
		return null;
	}
	if(!result || !Array.isArray(result.running)){ return null; }
	const seen={};
	return result.running.filter((each) => {
		if(!each || typeof each.id!=="string" || seen[each.id]){ return false; }
		seen[each.id]=true;
		return each.id!==appid && RUNNING_HIDDEN.indexOf(each.id)===-1 && (each.defaultWindowType===undefined || each.defaultWindowType==="card");
	}).map((each) => each.id);
}

async function closerunning(id){
	try {
		const result=await runningcall('luna://com.webos.applicationManager/closeByAppId',{"id":id});
		return !!result && result.returnValue!==false && result.errorText===undefined;
	} catch(e) {
		return false;
	}
}

function runningname(id){
	const app=applist?applist.filter((each) => each.id===id)[0]:null;
	return app?appdisplayname(app):id;
}

let runningbusy=false;

async function openrunning(){
	if(runningbusy){ return; }
	if(!rooted && !turstedapp){
		showmovetoast("Seeing running apps needs a rooted TV.");
		return;
	}
	if(!appmenuopen() && typeof dpadfocus!=="undefined" && dpadfocus){ returnto=dpadfocus; }
	appmenutitle.textContent="Running apps";
	appmenulist.innerHTML="";
	appmenulist.appendChild(el("div","sstatus","Looking..."));
	maindiv.classList.add("menuopen");
	runningbusy=true;
	const ids=await runningapps();
	runningbusy=false;
	if(!appmenuopen()){ return; }      // closed while we were asking
	showrunning(ids);
}

function showrunning(ids){
	appmenulist.innerHTML="";
	if(ids===null){
		appmenutitle.textContent="Running apps";
		appmenulist.appendChild(el("div","sstatus","The TV didn't say which apps are running."));
		appmenulist.appendChild(runningbutton("Close",null,closeappmenu));
	} else if(ids.length===0){
		appmenutitle.textContent="Running apps";
		appmenulist.appendChild(el("div","sstatus","Nothing else is running."));
		appmenulist.appendChild(runningbutton("Close",null,closeappmenu));
	} else {
		appmenutitle.textContent="Running apps: OK closes one";
		ids.forEach((id) => {
			appmenulist.appendChild(runningbutton(runningname(id),id,() => closeone(id)));
		});
		const all=runningbutton("Close all ("+ids.length+")",null,() => closeall(ids));
		all.classList.add("danger");
		appmenulist.appendChild(all);
	}
	setfocus(within(appmenu,"button")[0] || null);
}

function runningbutton(label,id,onclick){
	const btn=el("button","sopt runningapp");
	if(id){
		const app=applist?applist.filter((each) => each.id===id)[0]:null;
		const icon=document.createElement("img");
		icon.className="runningicon";
		icon.alt="";
		if(app){
			icon.src=appiconsrc(app);
			if(validcolor(app.iconColor)){ icon.style.backgroundColor=app.iconColor; }
		} else {
			icon.src="access/fallback.png";
		}
		icon.addEventListener("error",() => { icon.src="access/fallback.png"; });
		btn.appendChild(icon);
	}
	btn.appendChild(el("span","runningname",label));
	if(id){
		const mark=el("span","runningclose");
		mark.innerHTML=iconsvg("close");
		btn.appendChild(mark);
	}
	btn.addEventListener("click",onclick);
	return btn;
}

async function refreshrunning(message){
	await pause(RUNNING_SETTLE_MS);
	const ids=await runningapps();
	if(message){ showmovetoast(message); }
	if(appmenuopen() && appmenutitle.textContent.indexOf("Running apps")===0){ showrunning(ids); }
}

async function closeone(id){
	const name=runningname(id);
	const ok=await closerunning(id);
	await refreshrunning(ok?"Closed "+name+".":"Couldn't close "+name+".");
}

async function closeall(ids){
	appmenutitle.textContent="Closing...";
	let closed=0;
	for(let i=0;i<ids.length;i++){
		if(await closerunning(ids[i])){ closed++; }
	}
	await refreshrunning(closed===ids.length?"Closed "+closed+(closed===1?" app.":" apps."):"Closed "+closed+" of "+ids.length+" apps.");
}

function initrunning(){
	runningbtn.addEventListener("click",openrunning);
}

document.addEventListener("DOMContentLoaded",initrunning);
