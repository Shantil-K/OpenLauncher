// Part of tools/simulator/snapshot.sh: reads what the simulator needs from the launcher running on the TV, through the web
// debugger (tunnelled to localhost:9998 by snapshot.sh), and prints it as JSON.
const list = await (await fetch('http://localhost:9998/json')).json();
const target = list.find((x) => x.description === 'com.homebrew.openlauncher');
if (!target) { console.error('OpenLauncher is not running on the TV'); process.exit(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
const expression = `(async () => {
	const ask = (url, payload) => (rooted ? lunacallasroot : lunacall)(url, payload || {});
	const inputs = await ask('luna://com.webos.service.eim/getAllInputStatus');
	const time = await lunacall('luna://com.webos.service.systemservice/getPreferences', {keys: ['timeFormat']});
	const device = await ask('luna://com.webos.service.tv.systemproperty/getSystemInfo', {keys: ['modelName', 'firmwareVersion']});
	const storage = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key.indexOf('openlauncher.') === 0 && key !== 'openlauncher.appcache') storage[key] = localStorage.getItem(key);
	}
	return {
		apps: applist,
		inputs: inputs,
		running: (await runningapps()) || [],
		timeFormat: time && time.timeFormat,
		device: device && device.modelName ? {modelName: device.modelName, firmwareVersion: device.firmwareVersion} : null,
		storage: storage,
		icons: applist.map((app) => { const icon = app.icon || ''; return icon.charAt(0) === '/' ? icon : (app.folderPath || '') + '/' + icon; })
			.filter((path) => /^\\/[^\\n]+\\.(png|jpe?g|svg|webp)$/i.test(path))
	};
})()`;
ws.send(JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {expression, awaitPromise: true, returnByValue: true}}));
ws.onmessage = (m) => {
	const d = JSON.parse(m.data);
	if (d.id !== 1) return;
	if (!d.result || !d.result.result || d.result.exceptionDetails) { console.error('reading the TV failed', JSON.stringify(d.result && d.result.exceptionDetails)); process.exit(1); }
	process.stdout.write(JSON.stringify(d.result.result.value));
	process.exit(0);
};
