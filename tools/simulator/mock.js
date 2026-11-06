//SPDX-License-Identifier: WTFNMFPL
// OpenLauncher simulator: stands in for the TV's system services so the real launcher (src/) runs in desktop Chrome, for
// recording demos. Loaded before the launcher's own scripts by tools/simulator/run.sh. Nothing here is shipped to TVs.
//
// The data comes from sim/data.js (window.OL_SIM), made from a TV by tools/simulator/snapshot.sh: its app list, inputs,
// running apps, 12/24-hour setting and the launcher's saved settings. Without a snapshot a few sample apps are used.
//
// Keys on this PC: arrows move, Enter is OK, Esc or Backspace is Back, 1 2 3 4 are the red, green, yellow and blue
// buttons. The pointer (OpenLauncher's own) hides when an arrow key is pressed, as on the TV.
(function () {
	"use strict";
	const SIM = window.OL_SIM || {};
	const SAMPLE_APPS = [
		{id: "com.webos.app.livetv", title: "Live TV", icon: "", folderPath: "/sample", visible: true, removable: false},
		{id: "com.webos.app.hdmi1", title: "HDMI 1", icon: "", folderPath: "/sample", visible: true, removable: false},
		{id: "sample.video", title: "Video app", icon: "", folderPath: "/sample", visible: true},
		{id: "sample.music", title: "Music app", icon: "", folderPath: "/sample", visible: true},
		{id: "com.homebrew.openlauncher", title: "OpenLauncher", icon: "icon.png", folderPath: "/sample", visible: true, trustLevel: "default", version: "sim"}
	];
	const apps = Array.isArray(SIM.apps) && SIM.apps.length ? SIM.apps : SAMPLE_APPS;
	// The launcher finds its own files (the placeholder icon for apps without one, its scripts) through its install folder on
	// the TV. Here that is the folder this page was loaded from.
	const here = decodeURI(location.pathname).replace(/\/[^\/]*$/, "");
	apps.forEach((app) => { if (app.id === "com.homebrew.openlauncher") { app.folderPath = here; app.icon = "icon.png"; } });
	let running = Array.isArray(SIM.running) ? SIM.running.slice() : [];

	// the launcher's saved settings from the TV, the first time this simulator profile runs
	try {
		if (SIM.storage && !localStorage.getItem("openlauncher.sim.seeded")) {
			Object.keys(SIM.storage).forEach((key) => localStorage.setItem(key, SIM.storage[key]));
			localStorage.setItem("openlauncher.sim.seeded", "1");
		}
	} catch (e) {}

	// LIGHTVIDEO=1 (record.sh): only the 2K H.264 aerials, which a computer decodes far more easily than the 4K ones, so a
	// recording doesn't stutter. Runs before the launcher's wallpaper starts (this script's listener is added first).
	if (SIM.lightVideo) {
		document.addEventListener("DOMContentLoaded", () => {
			if (typeof aerials === "undefined" || !Array.isArray(aerials)) { return; }
			const light = aerials.filter((entry) => /_2K_AVC|1080/i.test(entry.u));
			if (light.length > 0) { aerials.splice(0, aerials.length, ...light); }
		});
	}

	// ---- a small toast, like the TV's notifications
	function toast(message) {
		const box = document.createElement("div");
		box.className = "simtoast";
		box.textContent = message;
		document.body.appendChild(box);
		setTimeout(() => box.classList.add("on"), 20);
		setTimeout(() => { box.classList.remove("on"); setTimeout(() => box.remove(), 400); }, 3200);
	}

	function appname(id) {
		const app = apps.filter((each) => each.id === id)[0];
		return app ? app.title : id;
	}

	// ---- the services
	function luna(url, payload) {
		const path = String(url).replace(/^luna:\/\//, "").replace(/^com\.webos\.service\.application[mM]anager\//, "com.webos.applicationManager/");
		payload = payload || {};
		switch (path) {
			case "com.webos.applicationManager/listApps":
				return {returnValue: true, apps: apps};
			case "com.webos.applicationManager/running":
				return {returnValue: true, running: running.map((id) => ({id: id, defaultWindowType: "card"}))};
			case "com.webos.applicationManager/closeByAppId":
				running = running.filter((id) => id !== payload.id);
				return {returnValue: true, appId: payload.id};
			case "com.webos.applicationManager/launch":
				running = [payload.id].concat(running.filter((id) => id !== payload.id));
				toast("Opening " + appname(payload.id));
				return {returnValue: true, appId: payload.id};
			case "com.webos.applicationManager/setDefaultApp":
				return {returnValue: true};
			case "org.webosbrew.hbchannel.service/getConfiguration":
				return {returnValue: true, root: true};
			case "com.webos.service.eim/getAllInputStatus":
				return SIM.inputs || {returnValue: true, devices: []};
			case "com.webos.service.systemservice/getPreferences":
				return {returnValue: true, timeFormat: SIM.timeFormat || "HH24"};
			case "com.webos.service.tv.systemproperty/getSystemInfo":
				return Object.assign({returnValue: true}, SIM.device || {modelName: "Simulator", firmwareVersion: "-"});
			case "com.webos.notification/createToast":
				toast(payload.message || "");
				return {returnValue: true};
			case "com.webos.appInstallService/remove":
				toast("Uninstalling isn't simulated");
				return {returnValue: false, errorText: "not in the simulator"};
			default:
				return {returnValue: true};
		}
	}

	// the root shell (Homebrew Channel's exec): luna-send is answered by the services above, the rest harmlessly
	function unquote(text) {
		// '...' with '\'' inside, as the launcher quotes them
		const parts = [];
		const re = /'((?:[^']|'\\'')*)'/g;
		let match;
		while ((match = re.exec(text))) { parts.push(match[1].replace(/'\\''/g, "'")); }
		return parts;
	}

	function shell(command) {
		const out = (stdout) => ({returnValue: true, stdoutString: stdout, stderrString: ""});
		if (/^luna-send /.test(command)) {
			const parts = unquote(command);
			let payload = {};
			try { payload = JSON.parse(parts[1] || "{}"); } catch (e) {}
			return out(JSON.stringify(luna(parts[0], payload)));
		}
		if (/mktemp -d/.test(command)) { return out("/tmp/openlauncher-update.SIM0000\n"); }
		if (/mktemp /.test(command)) { return out("/media/developer/.openlauncher-backup.SIM0000\n"); }
		if (/KeyFilters\/systemUi\.js/.test(command) && /echo LEGACY/.test(command)) { return out("MODERN\n"); }
		if (/echo support=/.test(command)) { return out("support=yes\noverride=yes\nours=yes\nloaded=on\n"); }
		if (/ip_tables_names/.test(command)) { return out("closed\n"); }
		if (/^cat .*close-debugger\.sh|^cat .*guard\.sh/.test(command)) { return out("#!/bin/sh\n"); }
		if (/\/tmp\/usb/.test(command)) { return out(""); }
		return out("");
	}

	function PalmServiceBridge() {}
	PalmServiceBridge.prototype.call = function (url, json) {
		let payload = {};
		try { payload = JSON.parse(json || "{}"); } catch (e) {}
		const result = url === "luna://org.webosbrew.hbchannel.service/exec" ? shell(String(payload.command || "")) : luna(url, payload);
		setTimeout(() => { if (typeof this.onservicecallback === "function") { this.onservicecallback(JSON.stringify(result)); } }, 15);
	};
	window.PalmServiceBridge = PalmServiceBridge;
	window.webOSSystem = {deviceInfo: JSON.stringify(SIM.device || {modelName: "Simulator"}), close: function () {}};

	// ---- the remote, on this keyboard
	const COLOURS = {"1": 403, "2": 404, "3": 405, "4": 406, F1: 403, F2: 404, F3: 405, F4: 406};
	function typing() {
		const el = document.activeElement;
		return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.type !== "range";
	}
	function send(code) {
		const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true});
		Object.defineProperty(event, "keyCode", {get: () => code});
		Object.defineProperty(event, "which", {get: () => code});
		window.dispatchEvent(event);
	}
	window.addEventListener("keydown", (event) => {
		if (event.simulated) { return; }
		let code = null;
		if (event.key === "Escape" || (event.key === "Backspace" && !typing())) { code = 461; }
		else if (COLOURS[event.key] !== undefined && !typing()) { code = COLOURS[event.key]; }
		if (/^Arrow/.test(event.key) && !typing()) { hidepointer(); }
		if (code === null) { return; }
		event.preventDefault();
		event.stopImmediatePropagation();
		send(code);
	}, true);

	// ---- the pointer. It is drawn in the page (not as the system cursor), so screen recorders and Chrome's own frame capture
	// both show it: OpenLauncher's own pointer (pointer.svg, original artwork), which turns the accent colour while
	// pressed, and pops in and out when it appears and hides. The arrow keys hide it, as on the TV (webOS tells
	// the page with cursorStateChange).
	const TIP = [6, 6];      // where the tip is in pointer.svg
	let pointershown = false;
	let pointer = null;
	let image = null;
	let px = 0, py = 0;
	function makepointer() {
		if (pointer || !document.body) { return; }
		pointer = document.createElement("div");
		pointer.id = "simpointer";
		image = document.createElement("img");
		image.src = "sim/pointer.svg";
		image.alt = "";
		pointer.appendChild(image);
		document.body.appendChild(pointer);
	}
	function place() {
		if (pointer) { pointer.style.transform = "translate(" + (px - TIP[0]) + "px," + (py - TIP[1]) + "px)"; }
	}
	function hidepointer() {
		if (!pointershown) { return; }
		pointershown = false;
		if (pointer) {
			pointer.classList.remove("in");
			pointer.classList.add("out");
			setTimeout(() => { if (!pointershown && pointer) { pointer.style.display = "none"; } }, 150);
		}
		// with the pointer gone nothing is hovered any more, as on the TV
		document.documentElement.classList.add("simnopointer");
		document.dispatchEvent(new CustomEvent("cursorStateChange", {detail: {visibility: false}}));
	}
	window.addEventListener("mousemove", (event) => {
		makepointer();
		if (!pointer) { return; }
		px = event.clientX;
		py = event.clientY;
		place();      // only a transform on its own layer: nothing else is worked out per move
		if (pointershown) { return; }
		pointershown = true;
		pointer.style.display = "block";
		pointer.classList.remove("out");
		pointer.classList.remove("in");
		void pointer.offsetWidth;          // restart the pop-in
		pointer.classList.add("in");
		document.documentElement.classList.remove("simnopointer");
		document.dispatchEvent(new CustomEvent("cursorStateChange", {detail: {visibility: true}}));
	}, true);
	window.addEventListener("mousedown", () => { if (image) { image.src = "sim/pointer-pressed.svg"; } }, true);
	window.addEventListener("mouseup", () => { if (image) { image.src = "sim/pointer.svg"; } }, true);
})();
