//SPDX-License-Identifier: WTFNMFPL
// Live simulator (serve.mjs): when a file changes, swap the stylesheets (CSS only) or reload the page.
(function () {
	"use strict";
	let last = null;
	async function check() {
		try {
			const now = await (await fetch("/__changes", {cache: "no-store"})).json();
			if (last && now.other !== last.other) { location.reload(); return; }
			if (last && now.css !== last.css) {
				document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
					const href = link.getAttribute("href").split("?")[0];
					link.setAttribute("href", href + "?v=" + now.css);
				});
			}
			last = now;
		} catch (e) {}
		setTimeout(check, 700);
	}
	check();
})();
