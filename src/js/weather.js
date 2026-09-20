//SPDX-License-Identifier: WTFNMFPL
// Weather widget: current temperature and conditions from Open-Meteo (https://open-meteo.com, free, no key).
// Settings: see the Weather tab in settings.js. Placement works like the date: under the clock or anywhere on screen.

const WEATHER_CACHE_KEY='openlauncher.weather';
const WEATHER_REFRESH_MS=15*60*1000;

// WMO weather codes -> icon name (see icons.js) and text
function weatherinfo(code,isday){
	if(code===0){ return {icon:isday?"sun":"moon",text:"Clear"}; }
	if(code===1){ return {icon:isday?"sun":"moon",text:"Mostly clear"}; }
	if(code===2){ return {icon:isday?"partday":"partnight",text:"Partly cloudy"}; }
	if(code===3){ return {icon:"cloud",text:"Overcast"}; }
	if(code===45 || code===48){ return {icon:"fog",text:"Fog"}; }
	if(code>=51 && code<=57){ return {icon:"rain",text:"Drizzle"}; }
	if(code>=61 && code<=67){ return {icon:"rain",text:"Rain"}; }
	if((code>=71 && code<=77) || code===85 || code===86){ return {icon:"snow",text:"Snow"}; }
	if(code>=80 && code<=82){ return {icon:"rain",text:"Showers"}; }
	if(code>=95 && code<=99){ return {icon:"storm",text:"Thunderstorm"}; }
	return {icon:"cloud",text:"Unknown"};
}

let weatherdata=null;       // {temp, code, isday, at, unit, key}
let weatherstatus="";       // shown under the Location box in settings

function weatherkey(){
	return prefs.weatherPlace?prefs.weatherPlace.lat+","+prefs.weatherPlace.lon+","+prefs.weatherUnit:"";
}

function loadweathercache(){
	try {
		const saved=JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
		if(saved && typeof saved.temp==="number" && typeof saved.code==="number" && typeof saved.key==="string"){ weatherdata=saved; }
	} catch(e) {}
}

function saveweathercache(){
	try {
		localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify(weatherdata));
	} catch(e) {}
}

// what the widget says, or null if there is nothing to show yet
function weathertext(){
	if(!prefs.weatherShow || !prefs.weatherPlace || !weatherdata || weatherdata.key!==weatherkey()){ return null; }
	const info=weatherinfo(weatherdata.code,weatherdata.isday);
	return {
		icon:info.icon,
		temp:Math.round(weatherdata.temp)+"°"+(prefs.weatherUnit==="f"?"F":"C"),
		detail:info.text+" · "+prefs.weatherPlace.name
	};
}

function renderweather(){
	const shown=weathertext();
	weather.style.display=shown?"":"none";
	if(!shown){ return; }
	weathericon.innerHTML=iconsvg(shown.icon);
	weathertemp.textContent=shown.temp;
	weatherdetail.textContent=shown.detail;
}

async function fetchweather(){
	if(!prefs.weatherShow || !prefs.weatherPlace){ return; }
	const place=prefs.weatherPlace;
	const key=weatherkey();
	const url="https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(place.lat)+"&longitude="+encodeURIComponent(place.lon)+
		"&current=temperature_2m,weather_code,is_day&temperature_unit="+(prefs.weatherUnit==="f"?"fahrenheit":"celsius")+"&timezone=auto";
	try {
		const response=await fetch(url);
		if(!response.ok){ throw new Error("HTTP "+response.status); }
		const data=await response.json();
		const current=data.current;
		if(!current || typeof current.temperature_2m!=="number" || typeof current.weather_code!=="number"){ throw new Error("unexpected answer"); }
		if(key!==weatherkey()){ return; }   // the place or unit changed while this was loading
		weatherdata={temp:current.temperature_2m,code:current.weather_code,isday:current.is_day===1,at:Date.now(),key:key};
		saveweathercache();
		weatherstatus="Updated "+new Date(weatherdata.at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
	} catch(e) {
		weatherstatus="Couldn't load the weather. Will try again.";
	}
	renderweather();
	if(settingsisopen()){ renderpane(); }
}

// look a place name up; resolves to {name, lat, lon} or null
async function findplace(query){
	const url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(query)+"&count=1&language=en&format=json";
	const response=await fetch(url);
	if(!response.ok){ throw new Error("HTTP "+response.status); }
	const data=await response.json();
	const found=data.results && data.results[0];
	if(!found || typeof found.latitude!=="number" || typeof found.longitude!=="number"){ return null; }
	return {name:[found.name,found.country].filter(Boolean).join(", "),lat:found.latitude,lon:found.longitude};
}

let weatherquery="";

async function searchweather(){
	const query=weatherquery.trim();
	if(query===""){ return; }
	weatherstatus="Searching...";
	renderpane();
	try {
		const place=await findplace(query);
		if(place){
			weatherstatus="";
			setpref("weatherPlace",place);   // saves, applies (which fetches) and redraws
		} else {
			weatherstatus="Couldn't find “"+query+"”.";
			renderpane();
		}
	} catch(e) {
		weatherstatus="Couldn't search. Check the internet connection.";
		renderpane();
	}
}

// the Location row in the Weather tab (a "custom" item, see settings.js)
function renderweatherplace(box){
	const line=el("div","scontrol");
	const input=el("input","stext");
	input.setAttribute("type","text");
	input.setAttribute("placeholder",prefs.weatherPlace?prefs.weatherPlace.name:"City name");
	input.value=weatherquery;
	input.addEventListener("input",() => {weatherquery=input.value;});
	input.addEventListener("keydown",(event) => {
		if(event.keyCode===13){ searchweather(); }
	});
	line.appendChild(input);
	line.appendChild(optionbutton("Search",false,() => searchweather()));
	box.appendChild(line);
	const status=weatherstatus || (prefs.weatherPlace?"Showing "+prefs.weatherPlace.name:"Type a city and press Search");
	box.appendChild(el("div","sstatus",status));
}

// placement: under the clock and date, or on a layer of its own
function applyweatherplace(){
	const together=(prefs.weatherPos==="with-clock");
	(together?clockstack:weatherlayer).appendChild(weather);
	setposition(weatherlayer,together?prefs.clockPos:prefs.weatherPos);
	weatherlayer.style.display=together?"none":"";
}

// called by applyprefs()
function applyweather(){
	if(!prefs.weatherPlace){ weatherstatus=""; }   // no location: an old error message would be stale
	applyweatherplace();
	renderweather();
	if(prefs.weatherShow && prefs.weatherPlace && (!weatherdata || weatherdata.key!==weatherkey() || Date.now()-weatherdata.at>WEATHER_REFRESH_MS)){
		fetchweather();
	}
}

function initweather(){
	loadweathercache();
	// refresh every quarter of an hour while shown; the check is cheap and skips the network otherwise
	setInterval(() => {
		if(prefs.weatherShow && prefs.weatherPlace && !document.hidden && (!weatherdata || Date.now()-weatherdata.at>WEATHER_REFRESH_MS)){
			fetchweather();
		}
	},60*1000);
	applyweather();
}

document.addEventListener("DOMContentLoaded",initweather);
